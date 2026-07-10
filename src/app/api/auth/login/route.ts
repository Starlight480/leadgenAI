import { NextRequest, NextResponse } from "next/server"
import { sanitizeLoginInput, checkRateLimit, getRateLimitKey } from "@/lib/security"
import { getSupabaseAdmin } from "@/lib/supabase"

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

  // --- Try Supabase Auth first ---
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifierField === "email" ? sanitizedIdentifier : `${sanitizedIdentifier}@leadgen.local`,
      password: sanitizedPassword,
    })

    if (!error && data.session) {
      const response = NextResponse.json({ success: true, provider: "supabase" })
      response.cookies.set("leadgen_session", "authenticated", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      })
      return response
    }
  } catch {
    // Supabase Auth not available — fall back to hardcoded
  }

  // --- Fallback: hardcoded credentials ---
  // Match against email directly OR the prefix before @
  // (so both "dami@leadgen.os" and "dami" work)
  const HARDCODED_EMAIL = "dami@leadgen.os"
  const HARDCODED_PASSWORD = "LeadGen2026"
  const emailPrefix = sanitizedIdentifier.split("@")[0]
  const emailMatches = sanitizedIdentifier === HARDCODED_EMAIL || emailPrefix === HARDCODED_EMAIL.split("@")[0]
  const passwordMatches = sanitizedPassword === HARDCODED_PASSWORD

  if (emailMatches && passwordMatches) {
    const response = NextResponse.json({ success: true, provider: "legacy" })
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
