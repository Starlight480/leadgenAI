import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie")
  const session = verifySession(cookieHeader)

  if (session.authenticated) {
    return NextResponse.json({
      authenticated: true,
      provider: "jwt",
      email: session.email,
    })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
