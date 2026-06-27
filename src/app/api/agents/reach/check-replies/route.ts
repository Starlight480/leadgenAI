import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// IMAP polling endpoint — checks Gmail inbox for replies to outreach emails.
// Triggered by cron job (leadgen-followups) or manual call.
//
// Requires env: IMAP_USER, IMAP_PASS (Gmail app password)
// Uses the `imapflow` package for IMAP access.

export async function GET() {
  const supabase = getSupabaseAdmin()

  const IMAP_USER = process.env.IMAP_USER
  const IMAP_PASS = process.env.IMAP_PASS

  if (!IMAP_USER || !IMAP_PASS) {
    return NextResponse.json(
      { error: "IMAP credentials not configured. Set IMAP_USER and IMAP_PASS." },
      { status: 503 }
    )
  }

  try {
    // Dynamically import imapflow (only loaded when called)
    const { ImapFlow } = await import("imapflow")

    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: {
        user: IMAP_USER,
        pass: IMAP_PASS,
      },
      logger: false,
    })

    await client.connect()

    // Get all sent outreach items that are in "sent" status and have recipients
    const { data: outreachItems } = await supabase
      .from("outreach")
      .select("id, lead_id, recipient, subject, channel")
      .eq("status", "sent")
      .eq("channel", "email")
      .not("recipient", "is", null)

    if (!outreachItems || outreachItems.length === 0) {
      await client.logout()
      return NextResponse.json({ checked: 0, replies: 0, message: "No sent emails to check" })
    }

    // Collect all unique recipients we've emailed
    const recipientMap = new Map<string, string[]>() // email -> outreach IDs
    for (const item of outreachItems) {
      if (!item.recipient) continue
      const existing = recipientMap.get(item.recipient) || []
      existing.push(item.id)
      recipientMap.set(item.recipient, existing)
    }

    // Search Gmail inbox for replies from these recipients
    const lock = await client.getMailboxLock("INBOX")
    let repliesFound = 0

    try {
      // Search for messages from any of our recipients in the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      for (const [email, outreachIds] of recipientMap) {
        // Search for messages from this email address
        const searchResults = await client.search(
          { from: email, since: thirtyDaysAgo },
          { uid: true }
        )

        if (!searchResults || searchResults.length === 0) continue

        for (const uid of searchResults) {
          const message = await client.fetchOne(uid, { source: true, uid: true })
          if (!message || !message.source) continue

          const source = message.source.toString()

          // Extract subject to match against our outreach subjects
          const subjectMatch = source.match(/Subject:\s*(.+)/i)
          const subject = subjectMatch ? subjectMatch[1].trim() : ""

          // Extract body (simple text extraction)
          const bodyMatch = source.match(/\r?\n\r?\n([\s\S]*)/)
          const body = bodyMatch ? bodyMatch[1].trim().slice(0, 5000) : ""

          // Find matching outreach item
          const matchingId = outreachIds.find((id) => {
            const item = outreachItems.find((i) => i.id === id)
            if (!item?.subject) return false
            // Check if subject contains the original subject (threaded reply)
            return subject.includes(item.subject) || subject.includes(`Re: ${item.subject}`)
          })

          // If no exact subject match but we have outreach IDs, use the first one
          const outreachId = matchingId || outreachIds[0]
          const outreachItem = outreachItems.find((i) => i.id === outreachId)

          if (!outreachItem) continue

          // Check if we already recorded this reply
          const { data: existingEvent } = await supabase
            .from("pipeline_events")
            .select("id")
            .eq("lead_id", outreachItem.lead_id)
            .eq("event_type", "reply_received")
            .limit(1)

          if (existingEvent && existingEvent.length > 0) continue

          // Record the reply
          await supabase
            .from("outreach")
            .update({
              status: "replied",
              response_status: "replied",
              response_text: body.slice(0, 5000),
              response_at: new Date().toISOString(),
            })
            .eq("id", outreachId)

          // Update lead status
          if (outreachItem.lead_id) {
            await supabase
              .from("leads")
              .update({ status: "interested" })
              .eq("id", outreachItem.lead_id)
          }

          // Log pipeline event
          await supabase.from("pipeline_events").insert({
            lead_id: outreachItem.lead_id,
            agent: "reach",
            event_type: "reply_received",
            summary: `Reply received from ${email} — "${subject.slice(0, 60)}"`,
            details: {
              from: email,
              subject,
              body_preview: body.slice(0, 500),
              source_uid: String(uid),
              outreach_id: outreachId,
            },
            success: true,
          })

          repliesFound++
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()

    return NextResponse.json({
      checked: recipientMap.size,
      replies: repliesFound,
      message: `Checked ${recipientMap.size} recipients, found ${repliesFound} replies`,
    })
  } catch (error) {
    console.error("IMAP check-replies error:", error)
    return NextResponse.json(
      {
        error: "Failed to check replies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
