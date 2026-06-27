import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// POST /api/outreach/[id]/mark-reply
// Manually mark an outreach item as replied and update lead status.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabaseAdmin()

  // Load the outreach item
  const { data: item, error: fetchErr } = await supabase
    .from("outreach")
    .select("id, lead_id, channel, subject, recipient")
    .eq("id", id)
    .single()

  if (fetchErr || !item) {
    return NextResponse.json({ error: "Outreach item not found" }, { status: 404 })
  }

  // Parse optional reply text from body
  let replyText: string | null = null
  try {
    const body = await request.json()
    replyText = body.reply_text || null
  } catch {
    // No body — that's fine
  }

  // Update outreach item
  const { error: updateErr } = await supabase
    .from("outreach")
    .update({
      status: "replied",
      response_status: "replied",
      response_text: replyText,
      response_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Update lead status to interested
  if (item.lead_id) {
    const { error: leadErr } = await supabase
      .from("leads")
      .update({ status: "interested" })
      .eq("id", item.lead_id)

    if (leadErr) {
      console.error("Failed to update lead status:", leadErr)
    }

    // Log pipeline event
    await supabase.from("pipeline_events").insert({
      lead_id: item.lead_id,
      agent: "reach",
      event_type: "reply_received",
      summary: `Reply manually marked for ${item.recipient || "unknown"} on ${item.channel}`,
      details: {
        outreach_id: id,
        channel: item.channel,
        subject: item.subject,
        reply_text: replyText,
        manual: true,
      },
      success: true,
    })
  }

  return NextResponse.json({
    success: true,
    message: "Outreach marked as replied, lead status updated to interested",
  })
}
