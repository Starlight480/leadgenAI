"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, Plus, X, Play, Pause, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import type { Campaign } from "@/types"

const categories = [
  "restaurant", "salon", "barbershop", "hotel", "pharmacy",
  "church", "supermarket", "auto_repair", "school", "event_venue",
  "real_estate",
]

const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
  running: { icon: Play, color: "text-accent" },
  paused: { icon: Pause, color: "text-warning" },
  completed: { icon: CheckCircle, color: "text-success" },
  failed: { icon: AlertCircle, color: "text-error" },
}

export default function CampaignsPage() {
  const [showForm, setShowForm] = useState(false)
  const [running, setRunning] = useState(false)

  const { data: campaigns = [], isLoading: loading, mutate } = useSWR<Campaign[]>(
    "campaigns",
    async () => {
      const supabase = createBrowserClient()
      const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false })
      return data || []
    },
    { refreshInterval: 15000, revalidateOnFocus: true }
  )

  const handleRunCampaign = async (form: { category: string; city: string; area: string; radius: number }) => {
    setRunning(true)
    try {
      const res = await fetch("/api/agents/orchestrator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          city: form.city,
          area: form.area || undefined,
          radius_meters: form.radius,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Campaign complete! Found ${data.leads_found} leads, processed ${data.leads_processed}.`)
      mutate()
    } catch (err) {
      alert(`Campaign failed: ${err instanceof Error ? err.message : String(err)}`)
    }
    setRunning(false)
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Campaigns</h1>
          <p className="text-sm text-text-muted mt-1.5">Run Scout to find businesses without websites</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors flex items-center gap-2 min-h-[44px] shadow-sm"
        >
          <Plus size={15} />
          New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-bg-surface border border-border-default rounded-xl p-10 text-center text-text-muted text-sm shadow-sm">
            Loading campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-bg-surface border border-border-default rounded-xl p-10 text-center shadow-sm">
            <Search size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No campaigns yet. Create your first campaign to start finding leads.</p>
          </div>
        ) : (
          campaigns.map(c => {
            const { icon: StatusIcon, color } = statusConfig[c.status] || statusConfig.running
            return (
              <div key={c.id} className="bg-bg-surface border border-border-default rounded-xl p-5 hover:border-border-focus hover:shadow-sm transition-all duration-150 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <StatusIcon size={18} className={color} />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{c.name || `${c.category} in ${c.city}`}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {c.leads_found} leads found · {c.leads_processed} processed · {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                    style={{
                      backgroundColor: `${statusConfig[c.status]?.color === "text-success" ? "#10b981" : statusConfig[c.status]?.color === "text-error" ? "#ef4444" : statusConfig[c.status]?.color === "text-warning" ? "#f59e0b" : "#6366f1"}15`,
                      color: statusConfig[c.status]?.color === "text-success" ? "#10b981" : statusConfig[c.status]?.color === "text-error" ? "#ef4444" : statusConfig[c.status]?.color === "text-warning" ? "#f59e0b" : "#6366f1",
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Campaign Form Modal */}
      {showForm && (
        <CampaignForm
          onClose={() => setShowForm(false)}
          onRun={handleRunCampaign}
          running={running}
        />
      )}
    </div>
  )
}

function CampaignForm({
  onClose,
  onRun,
  running,
}: {
  onClose: () => void
  onRun: (form: { category: string; city: string; area: string; radius: number }) => void
  running: boolean
}) {
  const [form, setForm] = useState({
    category: "restaurant",
    city: "Lagos",
    area: "Lekki",
    radius: 5000,
  })

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">New Campaign</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent min-h-[44px]"
            >
              {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Area</label>
              <input
                type="text"
                placeholder="e.g. Lekki"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Radius: {(form.radius / 1000).toFixed(0)}km</label>
            <input
              type="range"
              min={1000}
              max={20000}
              step={1000}
              value={form.radius}
              onChange={e => setForm(f => ({ ...f, radius: parseInt(e.target.value) }))}
              className="w-full mt-1.5 accent-accent"
            />
          </div>
          <div className="bg-bg-primary rounded-xl p-4 text-xs text-text-muted border border-border-default">
            <p>This will search Google Maps for <strong className="text-text-primary">{form.category}</strong> businesses in <strong className="text-text-primary">{form.area || form.city}</strong> that don&apos;t have websites.</p>
            <p className="mt-1.5">Each lead will then be profiled by Scribe, built by Dev, and queued for outreach by Reach.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm hover:bg-bg-hover transition-colors min-h-[44px]">
              Cancel
            </button>
            <button
              onClick={() => onRun(form)}
              disabled={running}
              className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
            >
              {running ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Pipeline…
                </>
              ) : (
                <>
                  <Play size={14} />
                  Launch Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
