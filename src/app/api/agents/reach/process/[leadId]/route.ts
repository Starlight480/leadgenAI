import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { callLLM } from "@/lib/llm"
import nodemailer from "nodemailer"

// Gmail SMTP transporter
function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s/g, ""),
    },
  })
}

// Phone number normalization
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-()]/g, "")
  if (cleaned.startsWith("+234")) return cleaned
  if (cleaned.startsWith("0") && cleaned.length >= 11) return "+234" + cleaned.slice(1)
  if (/^[789]\d{9}$/.test(cleaned)) return "+234" + cleaned
  return cleaned
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === attempts) throw err
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error("unreachable")
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params
  const supabase = getSupabaseAdmin()
  const startTime = Date.now()

  // Load lead + profile
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single()

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  try {
    // Determine available contact channels
    const channels: { channel: string; recipient: string; requires_manual: boolean; reason: string }[] = []

    if (lead.email) {
      channels.push({ channel: "email", recipient: lead.email, requires_manual: false, reason: "" })
    }
    if (lead.phone) {
      channels.push({ channel: "whatsapp", recipient: lead.phone, requires_manual: true, reason: "WhatsApp requires manual send" })
      channels.push({ channel: "phone_call", recipient: lead.phone, requires_manual: true, reason: "Phone call requires manual action" })
    }
    if (lead.instagram) {
      channels.push({ channel: "instagram_dm", recipient: lead.instagram, requires_manual: true, reason: "Instagram DM requires manual send" })
    }

    if (channels.length === 0) {
      await supabase.from("pipeline_events").insert({
        lead_id: leadId,
        agent: "reach",
        event_type: "no_contact",
        summary: `No contact info found for "${lead.business_name}"`,
        success: false,
        error: "No email, phone, or Instagram found",
      })
      return NextResponse.json({ error: "No contact channels available" }, { status: 400 })
    }

    // Generate personalized outreach message via LLM
    const systemPrompt = `You are Reach, a cold outreach agent for LeadGen OS. Write personalized outreach messages for Nigerian businesses.

RULES:
- Reference the business by name
- Reference something specific from their profile
- Keep it short and clear (under 100 words)
- Include Damien's contact info
- Make the ask clear: "Can I show you a quick mockup?"
- Tone: professional but warm, not salesy
- End with: — Damien

OUTPUT FORMAT (JSON):
{
  "email_subject": "Subject line for email",
  "email_message": "Full email body",
  "whatsapp_message": "Short WhatsApp message",
  "instagram_dm": "Instagram DM message",
  "phone_script": "Phone call script"
}

Respond with ONLY the JSON.`

    const userPrompt = `Write outreach for:
Business: ${lead.business_name}
Category: ${lead.category}
Summary: ${profile?.business_summary || "N/A"}
Pitch: ${profile?.website_pitch || "N/A"}
Pages recommended: ${profile?.recommended_pages?.join(", ") || "N/A"}
Price: ₦${(profile?.price_recommendation_ngn || 0).toLocaleString()}
Damien's phone: ${process.env.SMTP_USER || "Available on request"}
Portfolio: https://dami.builds`

    const response = await withRetry(() =>
      callLLM(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        "xiaomi/mimo-v2.5",
        { temperature: 0.5, max_tokens: 1500 }
      )
    )

    let messages
    try {
      const content = response.content.trim()
      const jsonStr = content.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "")
      messages = JSON.parse(jsonStr)
    } catch {
      throw new Error(`Reach returned invalid JSON: ${response.content.slice(0, 200)}`)
    }

    // Create outreach queue items
    const outreachItems: Array<Record<string, unknown>> = []
    let emailsSent = 0

    for (const ch of channels) {
      let message = ""
      let subject: string | null = null

      switch (ch.channel) {
        case "email":
          message = messages.email_message
          subject = messages.email_subject
          break
        case "whatsapp":
          message = messages.whatsapp_message
          break
        case "phone_call":
          message = messages.phone_script
          break
        case "instagram_dm":
          message = messages.instagram_dm
          break
      }

      const item: Record<string, unknown> = {
        lead_id: leadId,
        channel: ch.channel,
        status: ch.requires_manual ? "manual_required" : "pending",
        subject,
        message,
        recipient: ch.recipient,
        requires_manual: ch.requires_manual,
        manual_reason: ch.reason || null,
        agent: "reach",
      }

      // Actually send email if SMTP is configured
      if (ch.channel === "email" && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = getTransporter()
          await transporter.sendMail({
            from: `"Damien — LeadGen OS" <${process.env.SMTP_USER}>`,
            to: ch.recipient,
            subject: subject || "Let me show you something",
            text: message,
            html: message.replace(/\n/g, "<br>"),
          })
          item.status = "sent"
          item.sent_at = new Date().toISOString()
          emailsSent++
        } catch (emailErr) {
          console.error("Email send failed:", emailErr)
          item.status = "failed"
          item.manual_reason = `Email send failed: ${emailErr instanceof Error ? emailErr.message : "unknown"}`
        }
      }

      outreachItems.push(item)
    }

    const { data: items, error: insertErr } = await supabase
      .from("outreach")
      .insert(outreachItems)
      .select("id, channel, status")

    if (insertErr) throw insertErr

    // Update lead status
    if (emailsSent > 0) {
      await supabase
        .from("leads")
        .update({ status: "contacted", pipeline_stage: "outreach_sent" })
        .eq("id", leadId)
    }

    // Log event
    const duration = Date.now() - startTime
    const manualCount = outreachItems.filter((i) => i.requires_manual).length

    await supabase.from("pipeline_events").insert({
      lead_id: leadId,
      agent: "reach",
      event_type: "outreach_created",
      summary: `Reach created ${items?.length} outreach items for "${lead.business_name}" — ${emailsSent} emails sent, ${manualCount} manual`,
      details: {
        items: items?.map((i) => ({ id: i.id, channel: i.channel, status: i.status })),
        emails_sent: emailsSent,
      },
      duration_ms: duration,
      success: true,
    })

    return NextResponse.json({
      outreach_count: items?.length || 0,
      emails_sent: emailsSent,
      manual_required: manualCount,
      items,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)

    await supabase.from("pipeline_events").insert({
      lead_id: leadId,
      agent: "reach",
      event_type: "outreach_failed",
      summary: `Reach failed for "${lead.business_name}": ${errMsg}`,
      success: false,
      error: errMsg,
      duration_ms: Date.now() - startTime,
    })

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
