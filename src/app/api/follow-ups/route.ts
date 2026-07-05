import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// GET /api/follow-ups — get pending follow-ups (for dashboard)
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get("lead_id")
  const status = searchParams.get("status") || "pending"

  let query = supabase
    .from("follow_ups")
    .select("*, leads!inner(business_name, category, city, phone, email, instagram, whatsapp)")
    .eq("status", status)
    .order("due_date", { ascending: true })

  if (leadId) {
    query = query.eq("lead_id", leadId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ follow_ups: data })
}

// POST /api/follow-ups — generate follow-up message
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { follow_up_id } = body

  if (!follow_up_id) {
    return NextResponse.json({ error: "follow_up_id is required" }, { status: 400 })
  }

  // Load the follow-up
  const { data: followUp, error: followUpErr } = await supabase
    .from("follow_ups")
    .select("*, leads!inner(*)")
    .eq("id", follow_up_id)
    .single()

  if (followUpErr || !followUp) {
    return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })
  }

  // Load business profile
  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("lead_id", followUp.lead_id)
    .single()

  // Load previous outreach messages
  const { data: previousOutreach } = await supabase
    .from("outreach")
    .select("message, channel, followup_number, sent_at")
    .eq("lead_id", followUp.lead_id)
    .order("created_at", { ascending: true })

  const lead = followUp.leads

  // Generate follow-up message with AI
  const channelContext = followUp.channel === "whatsapp" 
    ? "Write a WhatsApp message (shorter, more casual)"
    : followUp.channel === "instagram" 
    ? "Write an Instagram DM (very short, friendly)"
    : "Write a professional email"

  const previousMessages = previousOutreach
    ?.map((o, i) => `Message ${i + 1} (${o.channel}, sent ${o.sent_at}): ${o.message.substring(0, 100)}...`)
    .join("\n") || "No previous messages"

  const systemPrompt = `You are a sales outreach assistant for a web design business targeting Nigerian businesses.

RULES:
- Keep messages short and conversational
- Reference the specific business name
- Be helpful, not pushy
- This is follow-up #${followUp.followup_number}
- Reference that you sent a message before but they haven't replied
- Each follow-up should have a DIFFERENT angle/hook
- For WhatsApp/Instagram: shorter, more casual
- For email: slightly more professional
- Never be aggressive or guilt-tripping

The user's name is Dev.`

  const userPrompt = `${channelContext}

Business: ${lead.business_name} (${lead.category || "business"})
City: ${lead.city || "Nigeria"}

Previous messages sent:
${previousMessages}

Generate a follow-up message for follow-up #${followUp.followup_number}. 
- If #1: Gentle reminder, reference first message
- If #2: More direct, highlight value proposition
- If #3: Final attempt, be honest that this is the last message

Write ONLY the message text. No quotes, no explanation.`

  try {
    const { callLLM } = await import("@/lib/llm")
    const response = await callLLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], "deepseek/deepseek-chat-v3-0324", { temperature: 0.7, max_tokens: 500 })

    const message = response.content.trim()

    // Update the follow-up with the generated message
    await supabase
      .from("follow_ups")
      .update({ message })
      .eq("id", follow_up_id)

    return NextResponse.json({ message })
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate follow-up message" }, { status: 500 })
  }
}

// PATCH /api/follow-ups — mark follow-up as completed
export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { follow_up_id, status } = body

  if (!follow_up_id || !status) {
    return NextResponse.json({ error: "follow_up_id and status are required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("follow_ups")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", follow_up_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
