import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { id } = await params

  const { data, error } = await supabase
    .from("invoices")
    .update(body)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseAdmin()
  const { id } = await params

  const { error } = await supabase.from("invoices").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
