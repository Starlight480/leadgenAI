"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { sanitizeLoginInput } from "@/lib/security"

type Tab = "signin" | "signup"

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => {
        if (r.ok) router.push("/dashboard")
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const identifierField = email.includes("@") ? "email" as const : "username" as const
      const safeEmail = sanitizeLoginInput(email, identifierField)
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
      if (res.ok) {
        router.push("/dashboard")
      } else {
        setError("Invalid email or password")
      }
    } catch {
      setError("Connection failed")
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const safeEmail = sanitizeLoginInput(email, "email")
      const safePassword = sanitizeLoginInput(password, "password")
      if (!safeEmail.valid) {
        setError(safeEmail.error || "Invalid email")
        setLoading(false)
        return
      }
      if (!safePassword.valid) {
        setError(safePassword.error || "Invalid password")
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters")
        setLoading(false)
        return
      }
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: safeEmail.sanitized,
          password: safePassword.sanitized,
          name: name.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess("Account created! Signing you in…")
        // Auto sign-in after signup
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: safeEmail.sanitized, password: safePassword.sanitized }),
        })
        if (loginRes.ok) {
          router.push("/dashboard")
        } else {
          setSuccess("Account created. Please sign in.")
          setTab("signin")
        }
      } else {
        setError(data.error || "Unable to create account")
      }
    } catch {
      setError("Connection failed")
    }
    setLoading(false)
  }

  if (checking) return <div className="min-h-screen bg-bg-primary" />

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
          <p className="text-sm text-text-muted mt-2">
            {tab === "signin" ? "Sign in to your command centre" : "Create your account"}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-8 shadow-sm">
          {/* Tab toggle */}
          <div className="flex mb-6 bg-bg-primary rounded-lg p-1 border border-border-default">
            <button
              type="button"
              onClick={() => {
                setTab("signin")
                setError("")
                setSuccess("")
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === "signin"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup")
                setError("")
                setSuccess("")
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === "signup"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In form */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                  placeholder="Enter email or username"
                  autoFocus
                  autoComplete="username"
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
              {success && (
                <div className="px-4 py-3 rounded-lg bg-success/5 border border-success/15">
                  <p className="text-xs text-success font-medium">{success}</p>
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
          )}

          {/* Sign Up form */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                  placeholder="Your name"
                  autoFocus
                  autoComplete="name"
                />
              </div>
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
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-error/5 border border-error/15">
                  <p className="text-xs text-error font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="px-4 py-3 rounded-lg bg-success/5 border border-success/15">
                  <p className="text-xs text-success font-medium">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password || !confirmPassword}
                className="w-full py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}
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
