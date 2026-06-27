"use client"

import { useState } from "react"
import useSWR from "swr"
import { LayoutDashboard, Users, Search, Code, Send, Receipt, Activity, Zap, Loader2, Clock } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"

const quickActions = [
  { label: "View Leads", href: "/leads", icon: Users },
  { label: "New Campaign", href: "/campaigns", icon: Search },
  { label: "Projects", href: "/projects", icon: Code },
  { label: "Invoices", href: "/invoices", icon: Receipt },
]

const AGENT_ICONS: Record<string, string> = {
  scout: "🔍",
  scribe: "✍️",
  dev: "🛠️",
  reach: "📧",
  orchestrator: "🎯",
  system: "⚙️",
}

const CATEGORIES = ["restaurant", "salon", "barbershop", "hotel", "pharmacy", "church", "supermarket"]

export default function DashboardPage() {
  // Quick Scout state
  const [scoutCategory, setScoutCategory] = useState("restaurant")
  const [scoutCity, setScoutCity] = useState("Lagos")
  const [scoutArea, setScoutArea] = useState("Lekki")
  const [scoutRunning, setScoutRunning] = useState(false)
  const [scoutResult, setScoutResult] = useState<string | null>(null)

  type DashboardData = {
    stats: {
      totalLeads: number
      newToday: number
      contacted: number
      interested: number
      sitesBuilt: number
      revenue: number
      totalProjects: number
      emailsSent: number
      pendingFollowUps: number
      conversionRate: number
    }
    events: { summary: string; agent: string; created_at: string; success: boolean }[]
    weekActivity: { date: string; count: number; label: string }[]
  }

  const { data, isLoading: loading, mutate } = useSWR<DashboardData>(
    "dashboard",
    async () => {
      const supabase = createBrowserClient()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [leadsRes, eventsRes, projectsRes, invoicesRes, outreachRes] = await Promise.all([
        supabase.from("leads").select("status, created_at"),
        supabase.from("pipeline_events").select("summary, agent, created_at, success").order("created_at", { ascending: false }).limit(20),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("amount_ngn, status"),
        supabase.from("outreach").select("id", { count: "exact", head: true }).eq("status", "sent").gt("created_at", sevenDaysAgo),
      ])

      // Try to get pending follow-ups (table may not exist yet)
      let pendingFollowUps = 0
      try {
        const { count } = await supabase.from("follow_ups").select("id", { count: "exact", head: true }).eq("status", "pending")
        pendingFollowUps = count || 0
      } catch { /* follow_ups table doesn't exist yet */ }

      const leads = leadsRes.data || []
      const today = new Date().toISOString().split("T")[0]
      const invoices = invoicesRes.data || []
      const revenue = invoices
        .filter((inv: { status: string }) => inv.status === "paid")
        .reduce((sum: number, inv: { amount_ngn: number | null }) => sum + (inv.amount_ngn || 0), 0)

      const totalLeads = leads.length
      const interested = leads.filter((l: { status: string }) => l.status === "interested").length
      const contacted = leads.filter((l: { status: string }) => l.status === "contacted").length
      const specWritten = leads.filter((l: { status: string }) => l.status === "spec_written").length
      const siteBuilt = leads.filter((l: { status: string }) => l.status === "site_built").length
      const conversionRate = totalLeads > 0
        ? Math.round((interested + contacted + specWritten + siteBuilt) / totalLeads * 100)
        : 0

      // Build "This Week" activity (last 7 days grouped by day)
      const weekEventsRes = await supabase
        .from("pipeline_events")
        .select("created_at, success")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true })

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const weekActivity: { date: string; count: number; label: string }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dateStr = d.toISOString().split("T")[0]
        const count = (weekEventsRes.data || []).filter((e: { created_at: string }) => e.created_at.startsWith(dateStr)).length
        weekActivity.push({ date: dateStr, count, label: dayNames[d.getDay()] })
      }

      return {
        stats: {
          totalLeads,
          newToday: leads.filter((l: { created_at: string }) => l.created_at.startsWith(today)).length,
          contacted,
          interested,
          sitesBuilt: specWritten + siteBuilt,
          revenue,
          totalProjects: projectsRes.count || 0,
          emailsSent: outreachRes.count || 0,
          pendingFollowUps,
          conversionRate,
        },
        events: eventsRes.data || [],
        weekActivity,
      }
    },
    { refreshInterval: 10000, revalidateOnFocus: true }
  )

  const stats = data?.stats || { totalLeads: 0, newToday: 0, contacted: 0, interested: 0, sitesBuilt: 0, revenue: 0, totalProjects: 0, emailsSent: 0, pendingFollowUps: 0, conversionRate: 0 }
  const events = data?.events || []
  const weekActivity = data?.weekActivity || []

  const handleQuickScout = async (e: React.FormEvent) => {
    e.preventDefault()
    setScoutRunning(true)
    setScoutResult(null)
    try {
      // Create campaign
      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Quick Scout: ${scoutCategory} in ${scoutArea || scoutCity}`,
          category: scoutCategory,
          city: scoutCity,
          area: scoutArea || null,
          target_count: 10,
        }),
      })
      const campaign = await campaignRes.json()
      if (!campaign.id) throw new Error("Failed to create campaign")

      // Run Scout
      const scoutRes = await fetch("/api/agents/scout/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaign.id }),
      })
      const scoutData = await scoutRes.json()
      if (!scoutRes.ok) throw new Error(scoutData.error || "Scout failed")

      setScoutResult(`Found ${scoutData.leads_found || scoutData.leads?.length || 0} leads ✅`)
      mutate()
    } catch (err) {
      setScoutResult(`Failed: ${err instanceof Error ? err.message : "unknown error"}`)
    }
    setScoutRunning(false)
  }

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-info" },
    { label: "New Today", value: stats.newToday, icon: LayoutDashboard, color: "text-accent" },
    { label: "Contacted", value: stats.contacted, icon: Send, color: "text-warning" },
    { label: "Interested", value: stats.interested, icon: Activity, color: "text-success" },
    { label: "Projects", value: stats.totalProjects, icon: Code, color: "text-info" },
    { label: "Revenue", value: `₦${stats.revenue.toLocaleString()}`, icon: Receipt, color: "text-accent" },
    { label: "Emails Sent", value: stats.emailsSent, icon: Send, color: "text-info" },
    { label: "Pending Follow-ups", value: stats.pendingFollowUps, icon: Clock, color: "text-warning" },
    { label: "Conversion", value: `${stats.conversionRate}%`, icon: Activity, color: "text-success" },
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

      {/* This Week */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">This Week</h2>
        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="flex items-end gap-2 h-28">
            {weekActivity.map((day) => {
              const maxCount = Math.max(...weekActivity.map(d => d.count), 1)
              const height = Math.max((day.count / maxCount) * 100, 4)
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-muted font-medium">{day.count}</span>
                  <div
                    className="w-full rounded-t bg-accent/30 transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-text-muted">{day.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions + Quick Scout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
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

        {/* Quick Scout */}
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Scout</h2>
          <div className="bg-bg-surface border border-border-default rounded-lg p-4">
            <form onSubmit={handleQuickScout} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase text-text-muted font-semibold mb-1">Category</label>
                <select
                  value={scoutCategory}
                  onChange={(e) => setScoutCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] uppercase text-text-muted font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={scoutCity}
                    onChange={(e) => setScoutCity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-text-muted font-semibold mb-1">Area</label>
                  <input
                    type="text"
                    value={scoutArea}
                    onChange={(e) => setScoutArea(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={scoutRunning}
                className="w-full px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {scoutRunning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Scouting...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Quick Scout
                  </>
                )}
              </button>
              {scoutResult && (
                <p className={`text-xs text-center ${scoutResult.includes("✅") ? "text-success" : "text-error"}`}>
                  {scoutResult}
                </p>
              )}
            </form>
          </div>
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
              <p className="text-sm text-text-muted">No activity yet. Run a campaign or use agent buttons on a lead.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
              {events.slice(0, 10).map((event, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-lg w-7 text-center flex-shrink-0">
                    {AGENT_ICONS[event.agent] || "⚙️"}
                  </span>
                  <p className="text-sm text-text-secondary flex-1 truncate">{event.summary}</p>
                  <span className={`text-[11px] font-semibold ${event.success ? "text-success" : "text-error"}`}>
                    {event.success ? "✓" : "✗"}
                  </span>
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
