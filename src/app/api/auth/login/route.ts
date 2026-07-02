import { NextRequest, NextResponse } from "next/server"
import { sanitizeLoginInput, checkRateLimit, getRateLimitKey } from "@/lib/security"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, password } = body

  // --- Rate limiting (5 attempts per 15 min per IP) ---
  const rateLimitKey = getRateLimitKey(request)
  const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil((rateLimit.retryAfterMs ?? 900000) / 1000)
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    )
  }

  // --- Server-side input validation ---
  const usernameCheck = sanitizeLoginInput(username, "username")
  const passwordCheck = sanitizeLoginInput(password, "password")

  if (!usernameCheck.valid || !passwordCheck.valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const sanitizedUsername = usernameCheck.sanitized!
  const sanitizedPassword = passwordCheck.sanitized!

  // --- Credential check (generic error — never reveal which field is wrong) ---
  const u = process.env.AUTH_USERNAME || "dami"
  const p = process.env.AUTH_PASSWORD || "LeadGen2026"

  if (sanitizedUsername === u && sanitizedPassword === p) {
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
