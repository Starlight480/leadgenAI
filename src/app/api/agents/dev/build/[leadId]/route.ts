import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { callLLM } from '@/lib/llm'
import { withRetry } from '@/lib/utils'
import { generateHTML } from '@/lib/html-generator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params
  const body = await request.json().catch(() => ({}))

  // Approval gate — Dev only builds with explicit approval
  if (body.approved !== true) {
    return NextResponse.json(
      { error: 'Build not approved. Send approved=true to proceed.' },
      { status: 403 }
    )
  }

  const path = body.path || 'website'
  const supabase = getSupabaseAdmin()
  const startTime = Date.now()

  // Load lead + profile
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Run Scribe first — no business profile found' }, { status: 400 })
  }

  try {
    if (path === 'rental') {
      // Path B: Rental listing push to RentNaija
      return await handleRentalPath(supabase, lead, profile, startTime)
    }

    // Path A: Website build — generate spec only (HTML generated separately)
    const systemPrompt = `You are Dev, a website specification agent for LeadGen OS. Generate a website SPEC for a Nigerian business. Do NOT generate HTML code — just the spec.

RULES:
- Output a structured spec with colors, content, and page structure
- Mobile-first design choices
- Clean, modern (no glassmorphism, no gradients)
- Use Nigerian Naira (₦) for pricing
- Be specific and compelling with the content

OUTPUT FORMAT (valid JSON only):
{
  "site_type": "html",
  "pages": {"structure": ["hero", "about", "services", "contact", "footer"]},
  "color_palette": {"primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex"},
  "content": {
    "hero_headline": "...",
    "hero_subheadline": "...",
    "about_text": "...",
    "services": [{"name": "...", "description": "...", "price": "..."}],
    "contact_text": "...",
    "cta_text": "..."
  },
  "site_title": "Business Name - Tagline"
}

Respond with ONLY the JSON object. No markdown, no explanation.`

    const userPrompt = `Build a website for:
Business: ${lead.business_name}
Category: ${lead.category}
City: ${lead.city}, ${lead.area || ''}
Address: ${lead.address || 'Unknown'}
Phone: ${lead.phone || 'Not available'}
Summary: ${profile.business_summary}
Target Audience: ${profile.target_audience}
Pages: ${profile.recommended_pages?.join(', ')}
Pitch: ${profile.website_pitch}
Colors: ${profile.color_notes || 'Professional, clean'}
Price Range: ₦${(profile.price_recommendation_ngn || 0).toLocaleString()}
Lat/Lng: ${lead.lat || 'N/A'}, ${lead.lng || 'N/A'}`

    const response = await withRetry(() =>
      callLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 'deepseek/deepseek-chat-v3-0324', { temperature: 0.5, max_tokens: 2000 })
    )

    // Parse response
    let spec
    try {
      const content = response.content.trim()
      const jsonStr = content.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      spec = JSON.parse(jsonStr)
    } catch {
      try {
        const content = response.content.trim()
        let jsonStr = content.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
        const open = (jsonStr.match(/{/g) || []).length
        const close = (jsonStr.match(/}/g) || []).length
        jsonStr += '}'.repeat(open - close)
        jsonStr = jsonStr.replace(/,\s*$/, '')
        spec = JSON.parse(jsonStr)
      } catch {
        throw new Error(`Dev returned invalid JSON: ${response.content.slice(0, 300)}`)
      }
    }

    // Save spec
    const { data: savedSpec, error: specErr } = await supabase
      .from('specs')
      .insert({
        lead_id: leadId,
        profile_id: profile.id,
        site_type: spec.site_type || 'html',
        pages: spec.pages,
        color_palette: spec.color_palette,
        content: spec.content,
        tech_stack: ['html', 'css', 'javascript'],
        status: 'draft',
      })
      .select('id')
      .single()

    if (specErr) throw specErr

    // Create project
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .insert({
        lead_id: leadId,
        spec_id: savedSpec.id,
        business_name: lead.business_name,
        category: lead.category,
        status: 'spec_written',
        price_ngn: profile.price_recommendation_ngn,
        price_usd: profile.price_recommendation_usd,
        dev_notes: `Generated by Dev agent. Site type: ${spec.site_type}. Pages: ${(spec.pages?.structure || []).join(', ')}. HTML generated.`,
      })
      .select('id')
      .single()

    if (projErr) throw projErr

    // Update lead
    await supabase
      .from('leads')
      .update({ status: 'spec_written', pipeline_stage: 'built' })
      .eq('id', leadId)

    // Log event
    const duration = Date.now() - startTime
    await supabase.from('pipeline_events').insert({
      lead_id: leadId,
      agent: 'dev',
      event_type: 'spec_and_code_generated',
      summary: `Dev generated ${spec.site_type} site for "${lead.business_name}" — ${(spec.pages?.structure || []).length} sections`,
      details: { spec_id: savedSpec.id, project_id: project.id, site_type: spec.site_type },
      duration_ms: duration,
      success: true,
    })

    // Generate HTML from spec
    const generatedHTML = generateHTML(
      {
        site_type: spec.site_type,
        pages: spec.pages,
        color_palette: spec.color_palette,
        content: spec.content,
        tech_stack: spec.tech_stack,
      },
      lead.business_name,
      lead.category
    )

    return NextResponse.json({
      spec_id: savedSpec.id,
      project_id: project.id,
      generated_html: generatedHTML,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)

    await supabase
      .from('leads')
      .update({ status: 'failed', pipeline_stage: 'failed' })
      .eq('id', leadId)

    await supabase.from('pipeline_events').insert({
      lead_id: leadId,
      agent: 'dev',
      event_type: 'build_failed',
      summary: `Dev failed for "${lead.business_name}": ${errMsg}`,
      success: false,
      error: errMsg,
      duration_ms: Date.now() - startTime,
    })

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

async function handleRentalPath(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  lead: Record<string, unknown>,
  profile: Record<string, unknown>,
  startTime: number
) {
  try {
    const { data: listing, error: listErr } = await supabase
      .from('rentnaija_listings')
      .insert({
        lead_id: lead.id,
        title: `${lead.business_name} — ${lead.area || lead.city}`,
        listing_type: 'apartment',
        location: String(lead.address || lead.city),
        area: lead.area as string,
        city: lead.city as string,
        description: String(profile.business_summary || ''),
        source_platform: 'google_maps',
        pushed_to_rentnaija: false,
      })
      .select('id')
      .single()

    if (listErr) throw listErr

    await supabase
      .from('leads')
      .update({ status: 'spec_written', pipeline_stage: 'built' })
      .eq('id', lead.id)

    const duration = Date.now() - startTime
    await supabase.from('pipeline_events').insert({
      lead_id: lead.id as string,
      agent: 'dev',
      event_type: 'rental_listing_created',
      summary: `Dev created rental listing for "${lead.business_name}"`,
      details: { listing_id: listing.id },
      duration_ms: duration,
      success: true,
    })

    return NextResponse.json({ listing_id: listing.id })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    throw new Error(`Rental path failed: ${errMsg}`)
  }
}
