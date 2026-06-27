import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// GET /api/followups — returns pending follow-ups with lead info, sorted by due_date
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)

  const status = searchParams.get("status") || "pending"
  const leadId = searchParams.get("lead_id")

  let query = supabase
    .from("follow_ups")
    .select("*, leads!inner(id, business_name, category, city, phone, email, status)")
    .eq("status", status)
    .order("due_date", { ascending: true })

  if (leadId) {
    query = query.eq("lead_id", leadId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ followups: data })
}

// POST /api/followups — create a manual follow-up
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()

  if (!body.lead_id || !body.due_date) {
    return NextResponse.json(
      { error: "Missing required fields: lead_id, due_date" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("follow_ups")
    .insert({
      lead_id: body.lead_id,
      type: body.type || "manual",
      due_date: body.due_date,
      notes: body.notes || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ followup: data }, { status: 201 })
}

// PATCH /api/followups?id=xxx — update status (complete/skip)
export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
  }

  const body = await request.json()
  const validStatuses = ["pending", "completed", "skipped"]

  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {}
  if (body.status) updateData.status = body.status
  if (body.notes !== undefined) updateData.notes = body.notes

  const { data, error } = await supabase
    .from("follow_ups")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ followup: data })
}
