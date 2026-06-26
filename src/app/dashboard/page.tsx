"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, Users, Search, Code, Send, Receipt, Activity } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"

const quickActions = [
  { label: "View Leads", href: "/leads", icon: Users },
  { label: "New Campaign", href: "/campaigns", icon: Search },
  { label: "Projects", href: "/projects", icon: Code },
  { label: "Invoices", href: "/invoices", icon: Receipt },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newToday: 0,
    contacted: 0,
    interested: 0,
    sitesBuilt: 0,
    revenue: 0,
  })
  const [events, setEvents] = useState<{ summary: string; agent: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch stats in parallel
      const [leadsRes, eventsRes] = await Promise.all([
        supabase.from("leads").select("status, created_at"),
        supabase.from("pipeline_events").select("summary, agent, created_at").order("created_at", { ascending: false }).limit(20),
      ])

      const leads = leadsRes.data || []
      const today = new Date().toISOString().split("T")[0]

      setStats({
        totalLeads: leads.length,
        newToday: leads.filter(l => l.created_at.startsWith(today)).length,
        contacted: leads.filter(l => l.status === "contacted").length,
        interested: leads.filter(l => l.status === "interested").length,
        sitesBuilt: leads.filter(l => l.status === "site_built" || l.status === "spec_written").length,
        revenue: 0,
      })

      setEvents(eventsRes.data || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-info" },
    { label: "New Today", value: stats.newToday, icon: LayoutDashboard, color: "text-accent" },
    { label: "Contacted", value: stats.contacted, icon: Send, color: "text-warning" },
    { label: "Interested", value: stats.interested, icon: Activity, color: "text-success" },
    { label: "Sites Built", value: stats.sitesBuilt, icon: Code, color: "text-success" },
    { label: "Revenue", value: `₦${stats.revenue.toLocaleString()}`, icon: Receipt, color: "text-accent" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Lead generation command center</p>
        </div>
        <Link
          href="/campaigns"
          className="px-4 py-2 rounded-md bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Run Campaign
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-border-default rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">{label}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {loading ? "—" : value}
            </p>
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
        <div className="bg-bg-surface border border-border-default rounded-lg">
          {loading ? (
            <div className="p-8 text-center text-text-muted text-sm">Loading activity...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <Activity size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">No activity yet. Run a campaign to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
              {events.slice(0, 10).map((event, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                    {event.agent}
                  </span>
                  <p className="text-sm text-text-secondary flex-1 truncate">{event.summary}</p>
                  <span className="text-[11px] text-text-muted whitespace-nowrap">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
