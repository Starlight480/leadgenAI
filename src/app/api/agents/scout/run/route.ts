import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { withRetry } from '@/lib/utils'

// Phone number normalization for Nigerian numbers
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+234')) return cleaned
  if (cleaned.startsWith('0') && cleaned.length >= 11) return '+234' + cleaned.slice(1)
  if (/^[789]\d{9}$/.test(cleaned)) return '+234' + cleaned
  return cleaned
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { campaign_id } = body

  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
  }

  // Load campaign
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaign_id)
    .single()

  if (campErr || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const API_KEY = process.env.GOOGLE_PLACES_API_KEY
  if (!API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  const query = `${campaign.category} in ${campaign.area || ''} ${campaign.city}, Nigeria`.trim()
  const results: Record<string, unknown>[] = []
  let pageToken: string | undefined
  let pageCount = 0
  const maxPages = 3

  try {
    do {
      const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
      url.searchParams.set('query', query)
      url.searchParams.set('key', API_KEY)
      if (pageToken) {
        url.searchParams.set('pagetoken', pageToken)
        await new Promise(r => setTimeout(r, 2000)) // Google requires 2s delay
      }

      const response = await withRetry(() => fetch(url.toString()))
      const data = await response.json()

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status} — ${data.error_message || ''}`)
      }

      for (const result of data.results || []) {
        // Skip if business already has a website
        if (result.website) continue

        const phone = normalizePhone(result.formatted_phone_number || null)

        // Check for duplicate
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('google_place_id', result.place_id)
          .single()

        if (existing) continue

        results.push({
          business_name: result.name,
          category: campaign.category,
          city: campaign.city,
          area: campaign.area,
          address: result.formatted_address,
          lat: result.geometry?.location?.lat,
          lng: result.geometry?.location?.lng,
          phone,
          google_place_id: result.place_id,
          has_website: false,
          source: 'google_maps',
          status: 'new',
          priority: 'normal',
          lead_type: campaign.category === 'real_estate' ? 'rental_listing' : 'website_build',
          pipeline_stage: 'discovered',
          campaign_id: campaign_id,
        })
      }

      pageToken = data.next_page_token
      pageCount++
    } while (pageToken && pageCount < maxPages && results.length < campaign.target_count)

    // Bulk insert leads
    let leadsFound = 0
    if (results.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('leads')
        .insert(results.slice(0, campaign.target_count))
        .select('id')

      if (insertErr) throw insertErr
      leadsFound = inserted?.length || 0
    }

    // Update campaign
    await supabase
      .from('campaigns')
      .update({
        leads_found: campaign.leads_found + leadsFound,
        search_query: query,
        status: leadsFound > 0 ? 'completed' : 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaign_id)

    // Log event
    await supabase.from('pipeline_events').insert({
      campaign_id,
      agent: 'scout',
      event_type: 'scout_completed',
      summary: `Scout found ${leadsFound} leads for "${query}"`,
      details: { query, results_count: results.length, leads_inserted: leadsFound },
      success: true,
    })

    return NextResponse.json({ leads_found: leadsFound, query })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)

    await supabase
      .from('campaigns')
      .update({ status: 'failed', error: errMsg })
      .eq('id', campaign_id)

    await supabase.from('pipeline_events').insert({
      campaign_id,
      agent: 'scout',
      event_type: 'scout_failed',
      summary: `Scout failed: ${errMsg}`,
      success: false,
      error: errMsg,
    })

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
