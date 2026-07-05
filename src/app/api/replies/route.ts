import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { callLLM } from "@/lib/llm"

// GET /api/replies?lead_id=xxx — get replies for a lead
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get("lead_id")

  if (!leadId) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("replies")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ replies: data })
}

// POST /api/replies — log a reply and analyze with AI
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { lead_id, channel, message, outreach_id } = body

  if (!lead_id) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 })
  }

  // Analyze the reply with AI if message provided
  let sentiment = "neutral"
  let aiAnalysis = ""

  if (message && message.trim().length > 0) {
    try {
      const analysisResponse = await callLLM([
        {
          role: "system",
          content: `You are a reply analyzer for a web design business. Analyze the reply and determine:
1. Sentiment: positive, negative, neutral, question, wrong_person, interested, not_interested, needs_info
2. Brief analysis of what the person means

Respond in JSON format ONLY:
{"sentiment": "...", "analysis": "..."}

Sentiment guidelines:
- positive/interested: They want to proceed or are excited
- negative/not_interested: They clearly don't want the service
- neutral: They acknowledged but didn't commit
- question: They asked a question (needs more info)
- wrong_person: This isn't the right contact
- needs_info: They want more details before deciding`
        },
        {
          role: "user",
          content: `Reply from ${body.business_name || "a business"}:\n\n"${message}"`
        }
      ], "deepseek/deepseek-chat-v3-0324", { temperature: 0.3, max_tokens: 200 })

      const parsed = JSON.parse(analysisResponse.content.trim())
      sentiment = parsed.sentiment || "neutral"
      aiAnalysis = parsed.analysis || ""
    } catch {
      // If AI analysis fails, just save the raw reply
      sentiment = "neutral"
      aiAnalysis = "Analysis unavailable"
    }
  }

  // Save the reply
  const { data: reply, error: replyErr } = await supabase
    .from("replies")
    .insert({
      lead_id,
      outreach_id: outreach_id || null,
      channel: channel || null,
      message: message || null,
      sentiment,
      ai_analysis: aiAnalysis,
    })
    .select()
    .single()

  if (replyErr) return NextResponse.json({ error: replyErr.message }, { status: 500 })

  // Update lead status based on sentiment
  let newStatus = "warm"
  if (sentiment === "positive" || sentiment === "interested") {
    newStatus = "hot"
  } else if (sentiment === "negative" || sentiment === "not_interested" || sentiment === "wrong_person") {
    newStatus = "dead"
  } else if (sentiment === "needs_info" || sentiment === "question") {
    newStatus = "warm"
  }

  await supabase
    .from("leads")
    .update({
      outreach_status: newStatus,
      replied_at: new Date().toISOString(),
      reply_count: supabase.rpc ? 1 : 0,
    })
    .eq("id", lead_id)

  // Increment reply count
  const { data: lead } = await supabase
    .from("leads")
    .select("reply_count")
    .eq("id", lead_id)
    .single()

  if (lead) {
    await supabase
      .from("leads")
      .update({ reply_count: (lead.reply_count || 0) + 1 })
      .eq("id", lead_id)
  }

  // Cancel any pending follow-ups if they replied
  await supabase
    .from("follow_ups")
    .update({ status: "skipped" })
    .eq("lead_id", lead_id)
    .eq("status", "pending")

  return NextResponse.json({ reply, sentiment, ai_analysis: aiAnalysis })
}

// PATCH /api/replies — update reply (e.g., mark as read)
export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { reply_id, sentiment, ai_analysis } = body

  if (!reply_id) {
    return NextResponse.json({ error: "reply_id is required" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (sentiment) updates.sentiment = sentiment
  if (ai_analysis) updates.ai_analysis = ai_analysis

  const { error } = await supabase
    .from("replies")
    .update(updates)
    .eq("id", reply_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
