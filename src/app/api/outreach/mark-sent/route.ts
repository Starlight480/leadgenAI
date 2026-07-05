import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// POST /api/outreach/mark-sent — mark an outreach as sent and schedule follow-up
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { outreach_id } = body

  if (!outreach_id) {
    return NextResponse.json({ error: "outreach_id is required" }, { status: 400 })
  }

  // Load the outreach record
  const { data: outreach, error: outreachErr } = await supabase
    .from("outreach")
    .select("*")
    .eq("id", outreach_id)
    .single()

  if (outreachErr || !outreach) {
    return NextResponse.json({ error: "Outreach not found" }, { status: 404 })
  }

  // Mark as sent using existing schema
  const { error: updateErr } = await supabase
    .from("outreach")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", outreach_id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Update lead's outreach status
  await supabase
    .from("leads")
    .update({
      outreach_status: "contacted",
      last_contacted_at: new Date().toISOString(),
    })
    .eq("id", outreach.lead_id)

  // Increment outreach count
  const { data: lead } = await supabase
    .from("leads")
    .select("outreach_count")
    .eq("id", outreach.lead_id)
    .single()

  if (lead) {
    await supabase
      .from("leads")
      .update({ outreach_count: (lead.outreach_count || 0) + 1 })
      .eq("id", outreach.lead_id)
  }

  // Count previous outreach for this lead
  const { data: previousOutreach } = await supabase
    .from("outreach")
    .select("id")
    .eq("lead_id", outreach.lead_id)
    .eq("status", "sent")

  const followupNumber = (previousOutreach?.length || 0)

  // Schedule follow-up if we haven't hit max (3)
  if (followupNumber < 3) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3) // 3 days from now

    // Check if a follow-up is already scheduled
    const { data: existing } = await supabase
      .from("follow_ups")
      .select("id")
      .eq("lead_id", outreach.lead_id)
      .eq("followup_number", followupNumber + 1)
      .eq("status", "pending")
      .single()

    if (!existing) {
      await supabase.from("follow_ups").insert({
        lead_id: outreach.lead_id,
        outreach_id: outreach_id,
        followup_number: followupNumber + 1,
        due_date: dueDate.toISOString(),
        status: "pending",
        channel: outreach.channel,
      })
    }
  }

  return NextResponse.json({ success: true })
}
