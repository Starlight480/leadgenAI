import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, password } = body

  const u = process.env.AUTH_USERNAME || "dami"
  const p = process.env.AUTH_PASSWORD || "LeadGen2026"

  if (username === u && password === p) {
    const response = NextResponse.json({ success: true })
    response.cookies.set("leadgen_session", "authenticated", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    return response
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
}
