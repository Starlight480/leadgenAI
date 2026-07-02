import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/campaigns — list all campaigns
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data })
}

// POST /api/campaigns — create a campaign
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { category, city, area, radius_meters = 5000, target_count = 50 } = body

  if (!category || !city) {
    return NextResponse.json({ error: 'category and city are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name: `${category} in ${area ? area + ', ' : ''}${city}`,
      category,
      city,
      area: area || null,
      radius_meters,
      target_count,
      status: 'running',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
