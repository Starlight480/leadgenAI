import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { callLLM } from "@/lib/llm"
import { sendEmail } from "@/lib/resend"
import dns from "dns"
import { promisify } from "util"

const resolveMx = promisify(dns.resolveMx)

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

// Validate email exists by checking MX records
async function isValidEmail(email: string): Promise<boolean> {
  try {
    const domain = email.split("@")[1]
    if (!domain) return false
    const mxRecords = await resolveMx(domain)
    return mxRecords && mxRecords.length > 0
  } catch {
    return false
  }
}

// Template variable replacement
function replaceTemplateVars(
  text: string,
  vars: { business_name: string; city: string; category: string; sender_name: string }
): string {
  return text
    .replace(/\{\{business_name\}\}/g, vars.business_name)
    .replace(/\{\{city\}\}/g, vars.city)
    .replace(/\{\{category\}\}/g, vars.category)
    .replace(/\{\{sender_name\}\}/g, vars.sender_name)
}

// Create 3 auto follow-up reminders after email is sent
async function createFollowUps(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  leadId: string,
  emailSentAt: Date
) {
  const followUps = [
    {
      lead_id: leadId,
      type: "email_followup",
      due_date: new Date(emailSentAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Day 3
      notes: "Polite follow-up: checking if they saw the email",
      status: "pending",
    },
    {
      lead_id: leadId,
      type: "email_followup",
      due_date: new Date(emailSentAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Day 7
      notes: "Second follow-up: offer to show mockup",
      status: "pending",
    },
    {
      lead_id: leadId,
      type: "email_followup",
      due_date: new Date(emailSentAt.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Day 14
      notes: "Final follow-up: last chance before closing",
      status: "pending",
    },
  ]

  const { error } = await supabase.from("follow_ups").insert(followUps)
  if (error) {
    console.error("Failed to create follow-ups:", error)
  }
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
      // Only auto-send if email is verified (from business's own website)
      // Unverified emails (from search snippets/directories) need manual confirmation
      const isVerified = (lead as Record<string, unknown>).email_verified === true
      channels.push({
        channel: "email",
        recipient: lead.email,
        requires_manual: !isVerified,
        reason: isVerified ? "" : "Email from search snippet — verify before sending",
      })
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

    // --- Template-based email approach ---
    let emailSubject: string | null = null
    let emailMessage: string | null = null

    // Try to fetch a matching email template for this lead's category
    const { data: template } = await supabase
      .from("email_templates")
      .select("*")
      .eq("category", lead.category)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (template) {
      // Use template with variable replacement
      const vars = {
        business_name: lead.business_name,
        city: lead.city || "your area",
        category: lead.category,
        sender_name: "Dami",
      }
      emailSubject = replaceTemplateVars(template.subject, vars)
      emailMessage = replaceTemplateVars(template.body, vars)
    }

    // Generate personalized outreach message via LLM (for non-email channels + fallback)
    const systemPrompt = `You are writing emails and messages on behalf of Dami, a freelance web developer in Lagos, Nigeria. You are NOT an AI assistant. You are NOT a company. You are Dami — a real person reaching out to local businesses he genuinely thinks could benefit from a website.

CRITICAL RULES — BREAKING THESE RUINS THE EMAIL:
1. NEVER say "I hope this email finds you well" — that's spam language
2. NEVER say "Dear Sir/Madam" or "Dear Owner" — use their business name
3. NEVER use words like "leverage", "streamline", "solutions", "synergy", "utilize" — real people don't talk like that
4. NEVER mention AI, automation, LeadGen, or anything robotic
5. NEVER write more than 80 words in the email body — busy people don't read long emails
6. NEVER use exclamation marks more than once — over-excitement looks fake
7. NEVER start with "I am writing to..." — just get to the point
8. The email must sound like you typed it on your phone, not like a marketing team wrote it

EMAIL STRUCTURE (follow this exactly):

Line 1: Start with their business name — like you're talking to them directly
Line 2: One genuine compliment about what they're doing (NOT generic — reference something specific from their profile)
Line 3: Quick transition — "I build websites for businesses like yours" or similar
Line 4: One specific thing you'd do for them (NOT a list — just ONE thing)
Line 5: Portfolio link or mention
Line 6: Soft question — "want to see what yours could look like?" or "mind if I show you a quick mockup?"
Sign off: Just "Dami" — no title, no company name, no "Best regards"

EXAMPLE (this is the vibe, don't copy it word for word):
---
Hey Orange Grill,

Love what you're doing on Instagram — the food pics are unreal.

I build simple, clean websites for restaurants in Lagos. Something that shows your menu, location, and lets people order directly.

Here's something similar I made: starlight480.github.io/portfolio/

Would you want to see what yours could look like?

Dami
---

WHATSAPP/DM STRUCTURE (even shorter — 2-3 lines max):
- First line: compliment or observation about their business
- Second line: what you do
- Third line: soft ask with portfolio link

PHONE SCRIPT:
- Natural, conversational — like calling a friend's shop
- "Hey, I saw your page on Instagram..."
- Quick pitch in 10 seconds
- Ask if they'd be open to seeing a mockup

OUTPUT FORMAT (JSON only, no markdown, no code blocks):
{
  "email_subject": "short subject (under 6 words, lowercase, no spam trigger words like FREE or OFFER)",
  "email_message": "the email body following the structure above",
  "whatsapp_message": "short whatsapp message (2-3 lines)",
  "instagram_dm": "instagram dm (2-3 lines)",
  "phone_script": "natural phone conversation script"
}

IMPORTANT: The email_subject should look like something a friend would send — NOT a marketing email. Examples: "quick question about your page", "saw your page on instagram", "website idea for you" — NOT "Professional Website Development Services" or "Special Offer for Your Business"`;

    const userPrompt = `Write outreach for this business:

Business: ${lead.business_name}
Category: ${lead.category}
City: ${lead.city || "Lagos"}
Area: ${lead.area || "N/A"}
What they do: ${profile?.business_summary || "N/A"}
Their vibe/tone: ${profile?.tone_notes || "N/A"}
What I'd build for them: ${profile?.website_pitch || "N/A"}
Pages: ${profile?.recommended_pages?.join(", ") || "N/A"}
Portfolio: starlight480.github.io/portfolio/
My Instagram: @dami.builds`;

    const response = await withRetry(() =>
      callLLM(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        "deepseek/deepseek-chat-v3-0324",
        { temperature: 0.7, max_tokens: 2500 }
      )
    )

    let messages
    try {
      const content = response.content.trim()
      const jsonStr = content.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "")
      messages = JSON.parse(jsonStr)
    } catch {
      // Try to recover truncated JSON by closing open braces
      try {
        const content = response.content.trim()
        let jsonStr = content.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "")
        // Count open vs close braces
        const open = (jsonStr.match(/{/g) || []).length
        const close = (jsonStr.match(/}/g) || []).length
        jsonStr += "}".repeat(open - close)
        // Remove trailing comma if present
        jsonStr = jsonStr.replace(/,\s*$/, "")
        messages = JSON.parse(jsonStr)
      } catch {
        throw new Error(`Reach returned invalid JSON: ${response.content.slice(0, 300)}`)
      }
    }

    // Create outreach queue items
    const outreachItems: Array<Record<string, unknown>> = []
    let emailsSent = 0

    for (const ch of channels) {
      let message = ""
      let subject: string | null = null

      switch (ch.channel) {
        case "email":
          // Use template if available, otherwise use LLM-generated message
          if (emailSubject && emailMessage) {
            subject = emailSubject
            message = emailMessage
          } else {
            message = messages.email_message
            subject = messages.email_subject
          }
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

      // Actually send email via Resend if configured
      // BUT skip if requires_manual (unverified email — user must confirm first)
      if (ch.channel === "email" && process.env.RESEND_API_KEY && !ch.requires_manual) {
        // Validate email domain has MX records before sending
        const emailValid = await isValidEmail(ch.recipient)
        if (!emailValid) {
          console.log(`Email ${ch.recipient} failed MX check — marking as invalid`)
          item.status = "failed"
          item.manual_reason = `Email domain "${ch.recipient.split("@")[1]}" has no MX records — email likely doesn't exist`
        } else {
          const fromEmail = process.env.SMTP_USER || "noreply@leadgen-os.vercel.app"
          const result = await sendEmail({
            from: `"Dami" <onboarding@resend.dev>`,
            to: ch.recipient,
            subject: subject || "Let me show you something",
            text: message,
            trackOpens: true,
            trackClicks: true,
          })
          if (result.success) {
            item.status = "sent"
            item.sent_at = new Date().toISOString()
            item.resend_id = result.id
            emailsSent++
          } else {
            console.error("Email send failed:", result.error)
            item.status = "failed"
            item.manual_reason = `Email send failed: ${result.error}`
          }
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

      // Auto-create 3 follow-up reminders after successful email send
      await createFollowUps(supabase, leadId, new Date())
    }

    // Log event
    const duration = Date.now() - startTime
    const manualCount = outreachItems.filter((i) => i.requires_manual).length

    await supabase.from("pipeline_events").insert({
      lead_id: leadId,
      agent: "reach",
      event_type: "outreach_created",
      summary: `Reach created ${items?.length} outreach items for "${lead.business_name}" — ${emailsSent} emails sent, ${manualCount} manual${template ? " (template: " + template.name + ")" : ""}`,
      details: {
        items: items?.map((i) => ({ id: i.id, channel: i.channel, status: i.status })),
        emails_sent: emailsSent,
        template_used: template?.name || null,
      },
      duration_ms: duration,
      success: true,
    })

    return NextResponse.json({
      outreach_count: items?.length || 0,
      emails_sent: emailsSent,
      manual_required: manualCount,
      template_used: template?.name || null,
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
