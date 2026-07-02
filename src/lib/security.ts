// Input sanitization and security utilities for LeadGen OS

// Dangerous patterns to reject — script injection, XSS, SQL injection
const DANGEROUS_PATTERNS = [
  // Script tags and JS execution
  /<\s*script/i,
  /javascript\s*:/i,
  /on\w+\s*=/,                    // onclick=, onerror=, etc.
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /<\s*svg\s+on/i,
  /data\s*:\s*text\/html/i,
  // SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|TRUNCATE)\b\s)/i,
  /(--|;|\/\*|\*\/|xp_cmdshell|0x[0-9a-f]+)/i,
  /'\s*or\s+'1'\s*=\s*'1/i,
  /'\s*or\s+1\s*=\s*1/i,
  // Template injection
  /\{\{.*\}\}/,
  /\$\{.*\}/,
  // Path traversal
  /\.\.\//,
  /\.\.\\/,
  // Command injection
  /[;&|`$]/,
  // Null bytes
  /\x00/,
]

// Characters that should never appear in username/password
const FORBIDDEN_CHARS = /[<>"'`&;|\\\/\x00-\x1f]/

// Maximum lengths
const MAX_USERNAME_LENGTH = 50
const MAX_PASSWORD_LENGTH = 128
const MAX_EMAIL_LENGTH = 254

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface SanitizeResult {
  valid: boolean
  error?: string
  sanitized?: string
}

/**
 * Sanitize a login input field (username or password).
 * Rejects dangerous patterns, trims whitespace, enforces length limits.
 */
export function sanitizeLoginInput(
  value: string,
  field: 'username' | 'password' | 'email'
): SanitizeResult {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Invalid input type' }
  }

  // Trim whitespace
  const trimmed = value.trim()

  // Check for empty
  if (trimmed.length === 0) {
    return { valid: false, error: `${field} cannot be empty` }
  }

  // Length check
  const maxLen = field === 'email' ? MAX_EMAIL_LENGTH : field === 'username' ? MAX_USERNAME_LENGTH : MAX_PASSWORD_LENGTH
  if (trimmed.length > maxLen) {
    return { valid: false, error: `${field} is too long` }
  }

  // For email: validate format
  if (field === 'email' && !EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  // Check for dangerous patterns (XSS, SQL injection, command injection)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: 'Input contains disallowed characters or patterns',
      }
    }
  }

  // For username/email: reject special characters entirely
  if ((field === 'username' || field === 'email') && FORBIDDEN_CHARS.test(trimmed)) {
    return {
      valid: false,
      error: 'Username contains invalid characters',
    }
  }

  return { valid: true, sanitized: trimmed }
}

/**
 * Sanitize a generic text input (for search queries, notes, etc.)
 * Less strict than login — allows more characters but blocks injection.
 */
export function sanitizeTextInput(value: string, maxLength = 500): SanitizeResult {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Invalid input type' }
  }

  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return { valid: true, sanitized: '' }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength}` }
  }

  // Block script injection but allow normal punctuation
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: 'Input contains disallowed content',
      }
    }
  }

  // HTML-encode dangerous characters
  const sanitized = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  return { valid: true, sanitized }
}

/**
 * Simple in-memory rate limiter.
 * In production, use Redis or Upstash for distributed rate limiting.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

/**
 * Check and increment rate limit for a given key.
 * @param key - Unique identifier (e.g., IP address)
 * @param maxAttempts - Max attempts per window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // If no entry or window expired, create fresh entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  // Window still active — check count
  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    }
  }

  // Increment
  entry.count++
  return { allowed: true, remaining: maxAttempts - entry.count }
}

/**
 * Generate a rate limit key from request headers.
 * Uses x-forwarded-for for proxied requests (Vercel), falls back to a default.
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Client-side lightweight sanitiser (stripHtml / sanitizeText) for
 * general-purpose input fields.  Kept for backward compatibility.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")          // HTML tags
    .replace(/javascript:/gi, "")      // JS URIs
    .replace(/on\w+\s*=/gi, "")       // inline event handlers
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .trim()
}

export function sanitizeText(value: string, maxLen = 1000): string {
  return stripHtml(value).slice(0, maxLen)
}
