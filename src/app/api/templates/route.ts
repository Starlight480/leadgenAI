import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// GET /api/templates — returns all templates (with ?category= filter)
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false })

  const category = searchParams.get("category")
  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  const activeOnly = searchParams.get("active")
  if (activeOnly === "true") {
    query = query.eq("is_active", true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

// POST /api/templates — create a template
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()

  if (!body.category || !body.name || !body.subject || !body.body) {
    return NextResponse.json(
      { error: "Missing required fields: category, name, subject, body" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      category: body.category,
      name: body.name,
      subject: body.subject,
      body: body.body,
      is_active: body.is_active !== undefined ? body.is_active : true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}

// DELETE /api/templates?id=xxx — delete a template
export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
  }

  const { error } = await supabase.from("email_templates").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
