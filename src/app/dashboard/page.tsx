"use client"

import { LayoutDashboard, Users, Search, Code, Send, Receipt, Activity } from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Total Leads", value: "0", icon: Users, color: "text-info" },
  { label: "New Today", value: "0", icon: LayoutDashboard, color: "text-accent" },
  { label: "Contacted", value: "0", icon: Send, color: "text-warning" },
  { label: "Interested", value: "0", icon: Activity, color: "text-success" },
  { label: "Sites Built", value: "0", icon: Code, color: "text-success" },
  { label: "Revenue", value: "₦0", icon: Receipt, color: "text-accent" },
]

const quickActions = [
  { label: "View Leads", href: "/leads", icon: Users },
  { label: "New Campaign", href: "/campaigns", icon: Search },
  { label: "Projects", href: "/projects", icon: Code },
  { label: "Invoices", href: "/invoices", icon: Receipt },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Lead generation command center</p>
        </div>
        <button className="px-4 py-2 rounded-md bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors">
          Run Campaign
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-border-default rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">{label}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-bg-surface border border-border-default rounded-lg p-4 hover:border-accent/40 hover:bg-bg-hover transition-colors flex items-center gap-3"
            >
              <Icon size={16} className="text-accent" />
              <span className="text-sm font-medium text-text-primary">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Recent Activity</h2>
        <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
          <Activity size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">No activity yet. Run a campaign to get started.</p>
        </div>
      </div>
    </div>
  )
}
