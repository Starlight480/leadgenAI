import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { callLLM } from "@/lib/llm"

// GET /api/outreach?lead_id=xxx — get outreach history for a lead
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get("lead_id")

  if (!leadId) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("outreach")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ outreach: data })
}

// POST /api/outreach — generate a message and create outreach record
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { lead_id, channel, followup_number = 0, template_id, custom_message } = body

  if (!lead_id || !channel) {
    return NextResponse.json({ error: "lead_id and channel are required" }, { status: 400 })
  }

  // Load lead data
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", lead_id)
    .single()

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  // Load business profile if exists
  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("lead_id", lead_id)
    .single()

  let message = custom_message
  let subject = ""

  if (!message) {
    // Try to load template if template_id provided
    if (template_id) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", template_id)
        .single()

      if (template) {
        message = template.body
          .replace(/BUSINESS_NAME/g, lead.business_name)
          .replace(/CITY/g, lead.city || "your area")
          .replace(/SENDER_NAME/g, "Dev")
        subject = template.subject
          .replace(/BUSINESS_NAME/g, lead.business_name)
          .replace(/CITY/g, lead.city || "your area")
      }
    }

    // Generate with AI if no template
    if (!message) {
      const channelContext = channel === "whatsapp" 
        ? "Write a WhatsApp message (shorter, more casual, use emojis sparingly)"
        : channel === "instagram" 
        ? "Write an Instagram DM (very short, friendly, casual)"
        : "Write a professional email"

      const followupContext = followup_number === 0
        ? "This is the FIRST contact. Introduce yourself and offer to build a website."
        : followup_number === 1
        ? "This is FOLLOW-UP #1. The person hasn't replied to your first message. Be friendly, reference the first message, and gently nudge."
        : followup_number === 2
        ? "This is FOLLOW-UP #2. Still no reply. Be more direct, mention the value proposition clearly."
        : "This is the FINAL follow-up (#3). Be direct but respectful. This is the last attempt."

      const systemPrompt = `You are a sales outreach assistant for a web design business targeting Nigerian businesses.

RULES:
- Keep messages short and conversational
- Reference the specific business name and category
- Be helpful, not pushy
- Include a clear call-to-action
- For WhatsApp/Instagram: shorter, more casual, use line breaks
- For email: slightly more professional, include subject line
- Never use fake testimonials or promises
- Always be honest about what you offer

The user's name is Dev. Use it as the sender.`

      const userPrompt = `${channelContext}

${followupContext}

Lead info:
- Business: ${lead.business_name}
- Category: ${lead.category || "business"}
- City: ${lead.city || "Nigeria"}
- Area: ${lead.area || ""}
- Has website: ${lead.has_website}
- Phone: ${lead.phone || "not available"}
- Instagram: ${lead.instagram || "not available"}

${profile ? `Business profile: ${profile.business_summary || ""}
Target audience: ${profile.target_audience || ""}
Website pitch: ${profile.website_pitch || ""}` : ""}

Write ONLY the message text. No quotes, no explanation.`

      try {
        const response = await callLLM([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ], "deepseek/deepseek-chat-v3-0324", { temperature: 0.7, max_tokens: 500 })

        message = response.content.trim()
      } catch (err) {
        return NextResponse.json({ error: "Failed to generate message" }, { status: 500 })
      }
    }
  }

  // Create outreach record
  const { data: outreach, error: outreachErr } = await supabase
    .from("outreach")
    .insert({
      lead_id,
      channel,
      message,
      subject: subject || null,
      status: "draft",
      followup_number,
      template_id: template_id || null,
    })
    .select()
    .single()

  if (outreachErr) return NextResponse.json({ error: outreachErr.message }, { status: 500 })

  return NextResponse.json({ outreach })
}
