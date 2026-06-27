"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  Search,
  Code,
  Send,
  Building,
  Receipt,
  Activity,
  Clock,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react"
import { useTheme } from "./theme-provider"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Search },
  { href: "/projects", label: "Projects", icon: Code },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/followups", label: "Follow-ups", icon: Clock },
  { href: "/rentnaija", label: "RentNaija", icon: Building },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/pipeline", label: "Pipeline", icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile hamburger button — always visible on mobile */}
      <button
        onClick={() => setMobileOpen(prev => !prev)}
        className="fixed top-3 left-3 z-[60] p-2 rounded-md bg-bg-surface border border-border-default md:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X size={20} className="text-text-primary" />
        ) : (
          <Menu size={20} className="text-text-primary" />
        )}
      </button>

      {/* Mobile backdrop — only shows when sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[39] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, slide on mobile */}
      <aside
        className="fixed left-0 top-0 h-screen w-60 bg-bg-surface border-r border-border-default flex flex-col z-[40] transition-transform duration-200 ease-out md:translate-x-0"
        style={{ transform: mobileOpen ? 'translateX(0)' : undefined }}
        data-mobile={mobileOpen ? 'open' : 'closed'}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border-default">
          <h1 className="text-lg font-bold text-text-primary tracking-tight">
            LeadGen <span className="text-accent">OS</span>
          </h1>
          <p className="text-[11px] text-text-muted mt-0.5">Command Center</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-accent/10 text-accent font-medium border-l-2 border-accent"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Theme toggle + Footer */}
        <div className="px-3 py-4 border-t border-border-default">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors w-full"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <p className="text-[10px] text-text-muted mt-3 px-3">
            v0.1.0 — 2026
          </p>
        </div>
      </aside>
    </>
  )
}
