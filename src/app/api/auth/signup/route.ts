import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitKey } from "@/lib/security"

export async function POST(request: NextRequest) {
  // --- Rate limiting ---
  const rateLimitKey = getRateLimitKey(request) + ":signup"
  const rateLimit = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    )
  }

  // Single-user system — registration is closed
  return NextResponse.json(
    { error: "Registration is currently closed. This is a single-user system." },
    { status: 503 }
  )
}