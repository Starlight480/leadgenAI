"use client"

import { useState, useEffect } from "react"

const CONSENT_KEY = "leadgen_cookie_consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (!consent) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable — show banner
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted")
    } catch {
      // localStorage unavailable — silently proceed
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:ml-64">
      <div className="max-w-4xl mx-auto bg-bg-surface border border-border-default rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-xs text-text-secondary leading-relaxed flex-1">
          We use cookies to manage your session. By continuing, you agree to our{" "}
          <a href="/terms" className="text-accent hover:underline">
            Terms of Service
          </a>
          .
        </p>
        <button
          onClick={handleAccept}
          className="px-5 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors whitespace-nowrap min-h-[36px]"
        >
          Accept
        </button>
      </div>
    </div>
  )
}
