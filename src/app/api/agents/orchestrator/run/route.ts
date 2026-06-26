import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { withRetry } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { category, city, area, radius_meters = 5000 } = body

  if (!category || !city) {
    return NextResponse.json({ error: 'category and city are required' }, { status: 400 })
  }

  // Create campaign
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .insert({
      name: `${category} in ${area ? area + ', ' : ''}${city}`,
      category,
      city,
      area: area || null,
      radius_meters,
      status: 'running',
      agent: 'orchestrator',
    })
    .select('id')
    .single()

  if (campErr || !campaign) {
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }

  const campaignId = campaign.id
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://leadgen-os.vercel.app'
  const startTime = Date.now()

  try {
    // Step 1: Run Scout
    await supabase.from('pipeline_events').insert({
      campaign_id: campaignId,
      agent: 'orchestrator',
      event_type: 'pipeline_started',
      summary: `Pipeline started: ${category} in ${area ? area + ', ' : ''}${city}`,
      success: true,
    })

    const scoutRes = await fetch(`${baseUrl}/api/agents/scout/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId }),
    })

    if (!scoutRes.ok) {
      const scoutErr = await scoutRes.text()
      throw new Error(`Scout failed: ${scoutErr}`)
    }

    const scoutData = await scoutRes.json()
    if (scoutData.leads_found === 0) {
      await supabase.from('pipeline_events').insert({
        campaign_id: campaignId,
        agent: 'orchestrator',
        event_type: 'pipeline_completed',
        summary: 'Pipeline completed — no new leads found',
        success: true,
      })

      return NextResponse.json({
        campaign_id: campaignId,
        status: 'completed',
        leads_found: 0,
        message: 'No new leads found for this search',
      })
    }

    // Step 2: Get new leads from this campaign
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'new')

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        campaign_id: campaignId,
        status: 'completed',
        leads_found: scoutData.leads_found,
        message: 'Scout found leads but none were new',
      })
    }

    // Step 3: Process each lead through Scribe → Dev → Reach
    let processed = 0
    let failed = 0

    for (const lead of leads) {
      try {
        // Scribe
        const scribeRes = await fetch(`${baseUrl}/api/agents/scribe/run/${lead.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!scribeRes.ok) throw new Error('Scribe failed')

        // Dev
        const devRes = await fetch(`${baseUrl}/api/agents/dev/build/${lead.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'website' }),
        })
        if (!devRes.ok) throw new Error('Dev failed')

        // Reach
        const reachRes = await fetch(`${baseUrl}/api/agents/reach/process/${lead.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!reachRes.ok) throw new Error('Reach failed')

        processed++
      } catch (err) {
        failed++
        // Lead failure doesn't stop the pipeline
        continue
      }
    }

    // Update campaign
    await supabase
      .from('campaigns')
      .update({
        leads_processed: processed,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    // Final event
    const duration = Date.now() - startTime
    await supabase.from('pipeline_events').insert({
      campaign_id: campaignId,
      agent: 'orchestrator',
      event_type: 'pipeline_completed',
      summary: `Pipeline completed: ${processed} processed, ${failed} failed out of ${leads.length} leads (${Math.round(duration / 1000)}s)`,
      details: { processed, failed, total: leads.length, duration_seconds: Math.round(duration / 1000) },
      duration_ms: duration,
      success: true,
    })

    return NextResponse.json({
      campaign_id: campaignId,
      status: 'completed',
      leads_found: scoutData.leads_found,
      leads_processed: processed,
      leads_failed: failed,
      duration_seconds: Math.round(duration / 1000),
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)

    await supabase
      .from('campaigns')
      .update({ status: 'failed', error: errMsg })
      .eq('id', campaignId)

    await supabase.from('pipeline_events').insert({
      campaign_id: campaignId,
      agent: 'orchestrator',
      event_type: 'pipeline_failed',
      summary: `Pipeline failed: ${errMsg}`,
      success: false,
      error: errMsg,
      duration_ms: Date.now() - startTime,
    })

    return NextResponse.json({ error: errMsg, campaign_id: campaignId }, { status: 500 })
  }
}
