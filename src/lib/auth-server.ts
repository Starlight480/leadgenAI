/**
 * Server-side Auth Utilities
 * Uses Node.js crypto for JWT signing + password hashing.
 * No external dependencies — uses built-in crypto only.
 */

import { createHmac, randomBytes, timingSafeEqual, scryptSync } from "crypto"

// ─── Config ────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dami@leadgen.os"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "LeadGen2026"
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  // Generate a persistent secret from a stable base if none configured
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

    // Verify signature
    const expectedSig = createHmac("sha256", JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url")

    const sigBuffer = Buffer.from(signatureB64, "base64url")
    const expectedBuffer = Buffer.from(expectedSig, "base64url")

    if (sigBuffer.length !== expectedBuffer.length) return null
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null

    // Parse payload
    const payload = JSON.parse(fromBase64url(payloadB64)) as SessionPayload

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

// ─── Password Hashing ──────────────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const key = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${key}`
}

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":")
  if (!salt || !key) return false
  const derivedKey = scryptSync(password, salt, 64).toString("hex")
  return timingSafeEqual(Buffer.from(key), Buffer.from(derivedKey))
}

// Since we store the raw password in env, we hash it once at module load
const _adminPasswordHash = hashPassword(ADMIN_PASSWORD)

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Attempt login with email + password.
 * Returns JWT cookie config on success.
 */
export function attemptLogin(email: string, password: string): {
  success: boolean
  cookie?: string
  error?: string
} {
  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  // Accept both email and username (for backward compatibility)
  const inputEmail = email.includes("@") ? email : `${email}@leadgen.local`
  const adminEmailNormalized = ADMIN_EMAIL.toLowerCase()
  const inputNormalized = inputEmail.toLowerCase()

  // Check against admin creds — also accept just the prefix
  const adminPrefix = adminEmailNormalized.split("@")[0]
  const inputPrefix = inputNormalized.split("@")[0]
  const emailMatches = inputNormalized === adminEmailNormalized || inputPrefix === adminPrefix

  if (!emailMatches || !verifyPassword(password, _adminPasswordHash)) {
    return { success: false, error: "Invalid credentials" }
  }

  // Generate JWT
  const token = signJWT({ email: ADMIN_EMAIL, role: "admin" })

  // Return cookie setting
  const cookie = `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_SECONDS}`

  return { success: true, cookie }
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