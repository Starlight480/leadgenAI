"use client"

import { useState, useEffect } from "react"

const CONSENT_KEY = "leadgen_cookie_consent"
const PREFERENCES_KEY = "leadgen_cookie_preferences"

export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true, // Always on — required for session management
  analytics: false,
  marketing: false,
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (!consent) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(CONSENT_KEY, "customised")
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
    } catch {
      // localStorage unavailable
    }
    setVisible(false)
  }

  const handleAcceptAll = () => {
    savePreferences({ essential: true, analytics: true, marketing: true })
  }

  const handleEssentialOnly = () => {
    savePreferences(DEFAULT_PREFERENCES)
  }

  const handleSaveCustom = () => {
    savePreferences({ ...preferences, essential: true }) // Essential always on
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:ml-64">
      <div className="max-w-4xl mx-auto bg-bg-surface border border-border-default rounded-xl shadow-lg overflow-hidden">
        {/* Main banner */}
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-xs text-text-secondary leading-relaxed flex-1">
            We use cookies to manage your session and improve your experience.{" "}
            <a href="/terms" className="text-accent hover:underline">
              Learn more in our Terms of Service
            </a>
            .
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="px-4 py-2 rounded-lg border border-border-default text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors whitespace-nowrap min-h-[36px]"
            >
              Customize
            </button>
            <button
              onClick={handleEssentialOnly}
              className="px-4 py-2 rounded-lg border border-border-default text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors whitespace-nowrap min-h-[36px]"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors whitespace-nowrap min-h-[36px]"
            >
              Accept
            </button>
          </div>
        </div>

        {/* Customise panel */}
        {showCustomize && (
          <div className="border-t border-border-default p-4 space-y-3 bg-bg-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-primary">Essential cookies</p>
                <p className="text-[11px] text-text-muted">Required for session management and authentication. Cannot be disabled.</p>
              </div>
              <div className="w-9 h-5 rounded-full bg-accent/30 flex items-center justify-end px-0.5">
                <div className="w-4 h-4 rounded-full bg-accent" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-primary">Analytics cookies</p>
                <p className="text-[11px] text-text-muted">Help us understand how you use the dashboard.</p>
              </div>
              <button
                onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${preferences.analytics ? "bg-accent justify-end" : "bg-border-default justify-start"}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-primary">Marketing cookies</p>
                <p className="text-[11px] text-text-muted">Used for outreach tracking and email open rates.</p>
              </div>
              <button
                onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${preferences.marketing ? "bg-accent justify-end" : "bg-border-default justify-start"}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveCustom}
                className="px-5 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors min-h-[36px]"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
