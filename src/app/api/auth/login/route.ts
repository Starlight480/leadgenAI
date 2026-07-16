import { NextRequest, NextResponse } from "next/server"
import { sanitizeLoginInput, checkRateLimit, getRateLimitKey } from "@/lib/security"
import { attemptLogin } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, username, password } = body

  // Accept both 'email' and 'username' fields for backward compatibility
  const identifier = email || username

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
  const identifierField = identifier.includes("@") ? "email" as const : "username" as const
  const identifierCheck = sanitizeLoginInput(identifier, identifierField)
  const passwordCheck = sanitizeLoginInput(password, "password")

  if (!identifierCheck.valid || !passwordCheck.valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const sanitizedIdentifier = identifierCheck.sanitized!
  const sanitizedPassword = passwordCheck.sanitized!

  // --- Server-side auth via JWT ---
  const result = attemptLogin(sanitizedIdentifier, sanitizedPassword)

  if (!result.success) {
    return NextResponse.json({ error: result.error || "Invalid credentials" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true, provider: "jwt" })
  response.headers.set("Set-Cookie", result.cookie!)

  return response
}
