"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(prev => !prev)}
        className="fixed top-4 left-4 z-[60] p-2.5 rounded-lg bg-bg-surface border border-border-default shadow-sm md:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X size={20} className="text-text-primary" />
        ) : (
          <Menu size={20} className="text-text-primary" />
        )}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[39] md:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen w-64 bg-bg-surface border-r border-border-default flex flex-col z-[40] transition-transform duration-200 ease-out md:translate-x-0"
        style={{ transform: mobileOpen ? 'translateX(0)' : undefined }}
        data-mobile={mobileOpen ? 'open' : 'closed'}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border-default">
          <h1 className="text-lg font-bold text-text-primary tracking-tight">
            LeadGen <motion.span
              className="text-accent"
              animate={{
                textShadow: [
                  "0 0 0px currentColor",
                  "0 0 8px currentColor",
                  "0 0 0px currentColor",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >OS</motion.span>
          </h1>
          <p className="text-[11px] text-text-muted mt-1 tracking-wide uppercase">Command Centre</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? "bg-accent/10 text-accent font-semibold shadow-sm"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                }`}
                style={active ? { borderLeft: "3px solid var(--accent)" } : { borderLeft: "3px solid transparent" }}
              >
                <Icon size={17} className={active ? "" : "group-hover:scale-105 transition-transform duration-150"} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border-default space-y-2">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors w-full min-h-[44px]"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="inline-flex"
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </motion.span>
            </AnimatePresence>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <p className="text-[10px] text-text-muted px-3 tracking-wide">
            v0.1.0 — 2026
          </p>
        </div>
      </aside>
    </>
  )
}
