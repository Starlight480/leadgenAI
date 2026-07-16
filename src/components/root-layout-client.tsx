"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Loader2 } from "lucide-react"
import { sanitizeLoginInput } from "@/lib/security"
import { CookieConsent } from "@/components/cookie-consent"

const PUBLIC_ROUTES = new Set(["/", "/features", "/pricing", "/terms", "/login"])

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [auth, setAuth] = useState<boolean | null>(null)

  const checkAuth = useCallback(() => {
    // Skip auth check on public pages
    if (PUBLIC_ROUTES.has(pathname)) return
    fetch("/api/auth/check")
      .then((r) => {
        if (r.ok) {
          setAuth(true)
        } else {
          setAuth(false)
        }
      })
      .catch(() => setAuth(false))
  }, [pathname])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Periodic session check every 5 minutes
  useEffect(() => {
    if (PUBLIC_ROUTES.has(pathname)) return
    const interval = setInterval(() => {
      fetch("/api/auth/check")
        .then((r) => {
          if (!r.ok) {
            setAuth(false)
            router.push("/login")
          }
        })
        .catch(() => {
          // Network error — don't force logout, just wait for next check
        })
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [pathname, router])

  // Public landing pages — render directly, no auth gate
  if (PUBLIC_ROUTES.has(pathname)) {
    return <>{children}</>
  }

  if (auth === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!auth) {
    return <LoginInline onLogin={() => setAuth(true)} />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-5 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
      <CookieConsent />
    </div>
  )
}

function LoginInline({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const safeEmail = sanitizeLoginInput(email, "email")
      const safePassword = sanitizeLoginInput(password, "password")
      if (!safeEmail.valid || !safePassword.valid) {
        setError(safeEmail.error || safePassword.error || "Invalid input")
        setLoading(false)
        return
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail.sanitized, password: safePassword.sanitized }),
      })
      if (res.ok) onLogin()
      else setError("Invalid email or password")
    } catch {
      setError("Connection failed")
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg-primary px-4"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-elevated) 50%, var(--bg-primary) 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-5">
            <span className="text-2xl font-bold text-accent tracking-tight">LG</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            LeadGen <span className="text-accent">OS</span>
          </h1>
          <p className="text-sm text-text-muted mt-2">Sign in to your command centre</p>
        </div>

        {/* Login card */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                placeholder="Enter email address"
                autoFocus
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-error/5 border border-error/15">
                <p className="text-xs text-error font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          <p className="text-center text-[11px] text-text-muted mt-4">
            Need an account?{" "}
            <a href="/login" className="text-accent hover:underline">
              Sign up
            </a>
          </p>
        </div>

        <p className="text-center text-[11px] text-text-muted mt-6">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-accent hover:underline">
            Terms of Service
          </a>
        </p>
        <p className="text-center text-[11px] text-text-muted mt-1">
          v0.1.0 — 2026
        </p>
      </div>
    </div>
  )
}
