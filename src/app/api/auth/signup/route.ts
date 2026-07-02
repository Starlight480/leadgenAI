import { NextRequest, NextResponse } from "next/server"
import { sanitizeLoginInput, checkRateLimit, getRateLimitKey } from "@/lib/security"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, name } = body

  // --- Rate limiting (3 signups per 15 min per IP) ---
  const rateLimitKey = getRateLimitKey(request) + ":signup"
  const rateLimit = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil((rateLimit.retryAfterMs ?? 900000) / 1000)
    return NextResponse.json(
      {
        error: "Too many signup attempts. Please try again later.",
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    )
  }

  // --- Input validation ---
  const emailCheck = sanitizeLoginInput(email, "email")
  const passwordCheck = sanitizeLoginInput(password, "password")

  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.error || "Invalid email" }, { status: 400 })
  }
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.error || "Invalid password" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const sanitizedEmail = emailCheck.sanitized!
  const sanitizedPassword = passwordCheck.sanitized!
  const sanitizedName = typeof name === "string" ? name.trim().slice(0, 100) : ""

  // --- Create user via Supabase Auth ---
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password: sanitizedPassword,
      email_confirm: true,
      user_metadata: sanitizedName ? { name: sanitizedName } : undefined,
    })

    if (error) {
      if (error.message?.includes("already")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Unable to create account" }, { status: 500 })
    }

    if (data.user) {
      return NextResponse.json({ success: true })
    }
  } catch {
    // Supabase Auth not available
  }

  return NextResponse.json(
    { error: "Account creation is not available. Please contact the administrator." },
    { status: 503 }
  )
}
