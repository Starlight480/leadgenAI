import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { callLLM } from '@/lib/llm'
import { withRetry } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params
  const supabase = getSupabaseAdmin()

  // Load lead
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const startTime = Date.now()

  try {
    // Build research context from available lead data
    const researchContext = `
Business Name: ${lead.business_name}
Category: ${lead.category}
City: ${lead.city}
Area: ${lead.area || 'Unknown'}
Address: ${lead.address || 'Unknown'}
Phone: ${lead.phone || 'Not available'}
Instagram: ${lead.instagram || 'Not available'}
Has Website: ${lead.has_website}
Source: ${lead.source}
`.trim()

    // Scribe's prompt — grounded in lead data, no hallucination
    const systemPrompt = `You are Scribe, a business intelligence agent for LeadGen OS. Your job is to research a Nigerian business and create a detailed profile that will be used to build their website.

RULES:
- NEVER invent facts. If you don't know something, write "Unknown" or leave the field empty.
- A wrong profile is worse than an empty one — it will generate a bad website.
- Only use the information provided in the lead data.
- Be specific about WHY this business needs a website.

OUTPUT FORMAT (valid JSON only):
{
  "business_summary": "2-3 factual sentences about what this business does",
  "target_audience": "Who actually visits this business",
  "estimated_size": "small" | "medium" | "large",
  "existing_digital_presence": {"instagram": false, "facebook": false, "google_listing": true},
  "website_pitch": "WHY this specific business needs a website. Be specific and reference their category.",
  "recommended_pages": ["home", "about", "contact", ...],
  "color_notes": "Any brand colors observed or suggested",
  "tone_notes": "Suggested tone for the website",
  "price_recommendation_ngn": 150000,
  "price_recommendation_usd": 95
}

PRICING GUIDELINES:
- 1-2 pages: ₦80,000 – ₦150,000 ($50-$95)
- 3-4 pages: ₦150,000 – ₦300,000 ($95-$190)
- 5+ pages: ₦300,000 – ₦600,000 ($190-$380)

RECOMMENDED PAGES by category:
- Restaurant/Food: home, menu, about, contact, gallery
- Salon/Barbershop: home, services, about, contact, booking
- Hotel: home, rooms, amenities, gallery, booking, contact
- Pharmacy: home, services, about, contact, products
- Church: home, about, sermons, events, contact, donate
- General: home, about, services, contact

Respond with ONLY the JSON object. No markdown, no explanation.`

    const userPrompt = `Profile this business:\n\n${researchContext}`

    const response = await withRetry(() =>
      callLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 'deepseek/deepseek-chat-v3-0324', { temperature: 0.3, max_tokens: 2000 })
    )

    // Parse LLM response
    let profile
    try {
      const content = response.content.trim()
      const jsonStr = content.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      profile = JSON.parse(jsonStr)
    } catch {
      try {
        const content = response.content.trim()
        let jsonStr = content.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
        const open = (jsonStr.match(/{/g) || []).length
        const close = (jsonStr.match(/}/g) || []).length
        jsonStr += '}'.repeat(open - close)
        jsonStr = jsonStr.replace(/,\s*$/, '')
        profile = JSON.parse(jsonStr)
      } catch {
        throw new Error(`Scribe returned invalid JSON: ${response.content.slice(0, 300)}`)
      }
    }

    // Cross-check: validate profile quality before saving
    const validationErrors: string[] = []

    // Check business_summary is not empty/placeholder
    if (!profile.business_summary || profile.business_summary.trim().length < 10) {
      validationErrors.push('business_summary is empty or too short')
    }

    // Check recommended_pages has at least 2 entries
    if (!Array.isArray(profile.recommended_pages) || profile.recommended_pages.length < 2) {
      validationErrors.push(`recommended_pages has ${profile.recommended_pages?.length || 0} entries (minimum 2)`)
    }

    // Check price_recommendation_ngn is between 50000 and 1000000
    if (typeof profile.price_recommendation_ngn !== 'number' ||
        profile.price_recommendation_ngn < 50000 ||
        profile.price_recommendation_ngn > 1000000) {
      validationErrors.push(`price_recommendation_ngn is ${profile.price_recommendation_ngn} (must be 50000-1000000)`)
    }

    // Check website_pitch is not generic
    const genericPhrases = ['every business needs', 'in today\'s digital world']
    const pitchLower = (profile.website_pitch || '').toLowerCase()
    for (const phrase of genericPhrases) {
      if (pitchLower.includes(phrase)) {
        validationErrors.push(`website_pitch contains generic phrase: "${phrase}"`)
      }
    }
    if (!profile.website_pitch || profile.website_pitch.trim().length < 10) {
      validationErrors.push('website_pitch is empty or too short')
    }

    // If validation fails, mark as trash
    if (validationErrors.length > 0) {
      await supabase.from('leads').update({ status: 'trash', pipeline_stage: 'trash' }).eq('id', leadId)

      await supabase.from('pipeline_events').insert({
        lead_id: leadId,
        agent: 'scribe',
        event_type: 'profile_validation_failed',
        summary: `Scribe profiled "${lead.business_name}" but failed validation: ${validationErrors.join('; ')}`,
        details: { validation_errors: validationErrors, profile },
        duration_ms: Date.now() - startTime,
        success: false,
        error: validationErrors.join('; '),
      })

      return NextResponse.json({
        error: 'Profile validation failed — lead marked as trash',
        validation_errors: validationErrors,
      }, { status: 422 })
    }

    // Save business profile
    const { data: savedProfile, error: saveErr } = await supabase
      .from('business_profiles')
      .insert({
        lead_id: leadId,
        business_summary: profile.business_summary,
        target_audience: profile.target_audience,
        estimated_size: profile.estimated_size,
        existing_digital_presence: profile.existing_digital_presence,
        website_pitch: profile.website_pitch,
        recommended_pages: profile.recommended_pages,
        color_notes: profile.color_notes,
        tone_notes: profile.tone_notes,
        price_recommendation_ngn: profile.price_recommendation_ngn,
        price_recommendation_usd: profile.price_recommendation_usd,
      })
      .select('id')
      .single()

    if (saveErr) throw saveErr

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'profiled', pipeline_stage: 'profiled' })
      .eq('id', leadId)

    // Log event
    const duration = Date.now() - startTime
    await supabase.from('pipeline_events').insert({
      lead_id: leadId,
      agent: 'scribe',
      event_type: 'profile_written',
      summary: `Scribe profiled "${lead.business_name}" — ${profile.recommended_pages?.length || 3} pages, ₦${(profile.price_recommendation_ngn || 0).toLocaleString()}`,
      details: profile,
      duration_ms: duration,
      success: true,
    })

    return NextResponse.json({ profile_id: savedProfile.id })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)

    await supabase
      .from('leads')
      .update({ status: 'failed', pipeline_stage: 'failed' })
      .eq('id', leadId)

    await supabase.from('pipeline_events').insert({
      lead_id: leadId,
      agent: 'scribe',
      event_type: 'profile_failed',
      summary: `Scribe failed for "${lead.business_name}": ${errMsg}`,
      success: false,
      error: errMsg,
      duration_ms: Date.now() - startTime,
    })

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
