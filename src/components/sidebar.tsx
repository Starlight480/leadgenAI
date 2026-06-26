"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Search,
  Code,
  Send,
  Building,
  Receipt,
  Activity,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "./theme-provider"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Search },
  { href: "/projects", label: "Projects", icon: Code },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/rentnaija", label: "RentNaija", icon: Building },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/pipeline", label: "Pipeline", icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-bg-surface border-r border-border-default flex flex-col z-40">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
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
  )
}
