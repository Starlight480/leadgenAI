import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  // Check Supabase Auth session first
  try {
    const supabase = getSupabaseAdmin()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      return NextResponse.json({
        authenticated: true,
        provider: "supabase",
        expires_at: session.expires_at,
      })
    }
  } catch {
    // Supabase Auth not available — fall back to cookie check
  }

  // Fallback: check the simple cookie
  const legacySession = request.cookies.get("leadgen_session")?.value
  if (legacySession === "authenticated") {
    return NextResponse.json({ authenticated: true, provider: "legacy" })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
