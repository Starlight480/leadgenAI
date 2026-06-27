import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = request.cookies.get("leadgen_session")?.value
  if (session === "authenticated") {
    return NextResponse.json({ authenticated: true })
  }
  return NextResponse.json({ authenticated: false }, { status: 401 })
}
