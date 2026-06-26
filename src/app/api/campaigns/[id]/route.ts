import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/campaigns/[id] — get campaign with leads and events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabaseAdmin()

  const [campaignRes, leadsRes, eventsRes] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).single(),
    supabase.from('leads').select('*').eq('campaign_id', id).order('created_at', { ascending: false }),
    supabase.from('pipeline_events').select('*').eq('campaign_id', id).order('created_at', { ascending: false }),
  ])

  if (campaignRes.error || !campaignRes.data) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({
    campaign: campaignRes.data,
    leads: leadsRes.data || [],
    events: eventsRes.data || [],
  })
}

// PUT /api/campaigns/[id] — update campaign status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const body = await request.json()

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data })
}
