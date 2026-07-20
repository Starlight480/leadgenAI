/**
 * Server-side Auth Utilities
 * Verifies credentials against Supabase users table.
 * Uses Node.js crypto for JWT signing — no external deps.
 * Passwords are hashed with bcrypt (pgcrypto) in Supabase.
 */

import { createHmac, timingSafeEqual } from "crypto"
import { getSupabaseAdmin } from "./supabase"

// ─── Config ────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY || "leadgen-os-fallback-secret"
  return createHmac("sha256", seed).update("jwt-secret").digest("hex")
})()

const SESSION_DURATION_SECONDS = 24 * 60 * 60 // 24 hours
const COOKIE_NAME = "leadgen_session"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SessionPayload {
  email: string
  role: string
  iat: number
  exp: number
}

export interface AuthResult {
  authenticated: boolean
  email?: string
  role?: string
  error?: string
}

// ─── JWT Implementation (crypto-only, no jose/jsonwebtoken) ────────────────

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url")
}

function fromBase64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf-8")
}

function signJWT(payload: Omit<SessionPayload, "iat" | "exp">): string {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const data = { ...payload, iat: now, exp: now + SESSION_DURATION_SECONDS }

  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(data))
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url")

  return `${headerB64}.${payloadB64}.${signature}`
}

function verifyJWT(token: string): SessionPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts

    const expectedSig = createHmac("sha256", JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url")

    const sigBuffer = Buffer.from(signatureB64, "base64url")
    const expectedBuffer = Buffer.from(expectedSig, "base64url")

    if (sigBuffer.length !== expectedBuffer.length) return null
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null

    const payload = JSON.parse(fromBase64url(payloadB64)) as SessionPayload

    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Attempt login with email + password.
 * Verifies against Supabase users table (bcrypt-hashed passwords).
 * Returns JWT cookie config on success.
 */
export async function attemptLogin(email: string, password: string): Promise<{
  success: boolean
  cookie?: string
  error?: string
}> {
  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  // Normalise: accept "dami" as shorthand for "dami@leadgen.os"
  const inputEmail = email.includes("@") ? email.toLowerCase() : `${email.toLowerCase()}@leadgen.os`

  try {
    const supabase = getSupabaseAdmin()

    // Fetch user from Supabase by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password_hash, role")
      .eq("email", inputEmail)
      .single()

    if (error || !user) {
      return { success: false, error: "Invalid credentials" }
    }

    // Verify password using Supabase's crypt() function (bcrypt)
    // We let Postgres do the comparison so the hash never leaves the DB
    const { data: matchResult, error: matchError } = await supabase
      .rpc("verify_password", {
        input_password: password,
        stored_hash: user.password_hash,
      })

    if (matchError || !matchResult) {
      return { success: false, error: "Invalid credentials" }
    }

    // Generate JWT
    const token = signJWT({ email: user.email, role: user.role })

    const cookie = `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_SECONDS}`

    return { success: true, cookie }
  } catch {
    return { success: false, error: "Authentication failed" }
  }
}

/**
 * Verify a session from a request's cookie header.
 */
export function verifySession(cookieHeader: string | null): AuthResult {
  if (!cookieHeader) {
    return { authenticated: false }
  }

  const cookies = parseCookies(cookieHeader)
  const token = cookies[COOKIE_NAME]
  if (!token) {
    return { authenticated: false }
  }

  const payload = verifyJWT(token)
  if (!payload) {
    return { authenticated: false, error: "Session expired or invalid" }
  }

  return {
    authenticated: true,
    email: payload.email,
    role: payload.role,
  }
}

/**
 * Generate a cookie that clears the session (logout).
 */
export function getLogoutCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const part of cookieHeader.split(";")) {
    const eqIdx = part.indexOf("=")
    if (eqIdx > 0) {
      const key = part.slice(0, eqIdx).trim()
      const value = part.slice(eqIdx + 1).trim()
      result[key] = value
    }
  }
  return result
}
