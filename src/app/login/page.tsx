"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    fetch("/api/auth/check").then(r => {
      if (r.ok) router.push("/dashboard")
      else setChecking(false)
    }).catch(() => setChecking(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.push("/dashboard")
      } else {
        setError("Invalid username or password")
      }
    } catch {
      setError("Connection failed")
    }
    setLoading(false)
  }

  if (checking) return <div className="min-h-screen bg-bg-primary" />

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            LeadGen <span className="text-accent">OS</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-border-default bg-bg-surface text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-border-default bg-bg-surface text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
