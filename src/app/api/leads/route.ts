import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/leads — list leads with filters
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  const status = searchParams.get('status')
  if (status && status !== 'all') query = query.eq('status', status)

  const category = searchParams.get('category')
  if (category && category !== 'all') query = query.eq('category', category)

  const search = searchParams.get('search')
  if (search) query = query.or(`business_name.ilike.%${search}%,address.ilike.%${search}%`)

  const limit = parseInt(searchParams.get('limit') || '100')
  query = query.limit(limit)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data })
}

// POST /api/leads — create a lead manually
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()

  const { data, error } = await supabase
    .from('leads')
    .insert({
      business_name: body.business_name,
      category: body.category,
      city: body.city || 'Lagos',
      area: body.area || null,
      address: body.address || null,
      phone: body.phone || null,
      email: body.email || null,
      instagram: body.instagram || null,
      notes: body.notes || null,
      source: body.source || 'manual',
      status: 'new',
      priority: body.priority || 'normal',
      lead_type: 'website_build',
      pipeline_stage: 'discovered',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}
