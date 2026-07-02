import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  // Try to sign out from Supabase Auth
  try {
    const supabase = getSupabaseAdmin()
    await supabase.auth.signOut()
  } catch {
    // Supabase Auth not available — proceed with cookie clear
  }

  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://leadgen-os.vercel.app")
  )
  response.cookies.set("leadgen_session", "", { maxAge: 0, path: "/" })
  return response
}
