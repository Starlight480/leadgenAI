"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Clock,
  CheckCircle,
  SkipForward,
  Plus,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"

interface FollowUp {
  id: string
  lead_id: string
  type: string
  due_date: string
  status: "pending" | "completed" | "skipped"
  notes: string | null
  created_at: string
  leads: {
    id: string
    business_name: string
    category: string
    city: string
    phone: string | null
    email: string | null
    status: string
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  if (diff < -1) return `${Math.abs(diff)} days ago`
  if (diff <= 7) return `In ${diff} days`
  return date.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return "Overdue"
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff <= 7) return "This Week"
  if (diff <= 14) return "Next Week"
  return "Later"
}

function getDateGroupOrder(group: string): number {
  const order: Record<string, number> = {
    Overdue: 0,
    Today: 1,
    Tomorrow: 2,
    "This Week": 3,
    "Next Week": 4,
    Later: 5,
  }
  return order[group] ?? 6
}

function groupByDate(followups: FollowUp[]): { group: string; items: FollowUp[] }[] {
  const groups: Record<string, FollowUp[]> = {}
  for (const f of followups) {
    const group = getDateGroup(f.due_date)
    if (!groups[group]) groups[group] = []
    groups[group].push(f)
  }
  return Object.entries(groups)
    .map(([group, items]) => ({ group, items }))
    .sort((a, b) => getDateGroupOrder(a.group) - getDateGroupOrder(b.group))
}

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"pending" | "completed" | "skipped">("pending")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Overdue", "Today", "Tomorrow"]))
  const [showAddForm, setShowAddForm] = useState(false)

  const supabase = createBrowserClient()

  const fetchFollowups = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("follow_ups")
      .select("*, leads!inner(id, business_name, category, city, phone, email, status)")
      .eq("status", tab)
      .order("due_date", { ascending: true })
    setFollowups((data || []) as FollowUp[])
    setLoading(false)
  }, [tab])

  useEffect(() => {
    fetchFollowups()
  }, [fetchFollowups])

  const updateStatus = async (id: string, status: "completed" | "skipped") => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/followups?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setFollowups((prev) => prev.filter((f) => f.id !== id))
      }
    } catch (err) {
      console.error("Failed to update follow-up:", err)
    }
    setActionLoading(null)
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const grouped = groupByDate(followups)
  const pendingCount = followups.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Follow-ups</h1>
          <p className="text-sm text-text-muted mt-1">
            {tab === "pending"
              ? `${pendingCount} pending follow-ups`
              : `${tab === "completed" ? "Completed" : "Skipped"} follow-ups`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          <Plus size={14} />
          Add Follow-up
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-default">
        {(["pending", "completed", "skipped"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "text-accent border-accent"
                : "text-text-muted border-transparent hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center text-text-muted text-sm">
          Loading follow-ups...
        </div>
      ) : followups.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
          <Clock size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">
            {tab === "pending"
              ? "No pending follow-ups. Send outreach emails to auto-create follow-up reminders."
              : `No ${tab} follow-ups.`}
          </p>
        </div>
      ) : tab === "pending" ? (
        /* Grouped view for pending */
        <div className="space-y-4">
          {grouped.map(({ group, items }) => (
            <div key={group} className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has(group) ? (
                    <ChevronDown size={14} className="text-text-muted" />
                  ) : (
                    <ChevronRight size={14} className="text-text-muted" />
                  )}
                  <span className="text-sm font-semibold text-text-primary">{group}</span>
                  <span className="text-xs text-text-muted bg-bg-primary px-2 py-0.5 rounded">
                    {items.length}
                  </span>
                </div>
                {group === "Overdue" && (
                  <AlertCircle size={14} className="text-error" />
                )}
              </button>

              {expandedGroups.has(group) && (
                <div className="border-t border-border-default divide-y divide-border-default/50">
                  {items.map((followup) => (
                    <div
                      key={followup.id}
                      className="px-4 py-3 hover:bg-bg-hover/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Mail size={16} className="text-info mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-text-primary">
                              {followup.leads.business_name}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              {followup.leads.city}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                              {followup.leads.category}
                            </span>
                          </div>
                          {followup.notes && (
                            <p className="text-xs text-text-secondary mt-1">{followup.notes}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar size={12} className="text-text-muted" />
                            <span className="text-[11px] text-text-muted">
                              {formatDate(followup.due_date)}
                            </span>
                            <span className="text-[11px] text-text-muted">·</span>
                            <span className="text-[11px] text-text-muted">{followup.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateStatus(followup.id, "completed")}
                            disabled={actionLoading === followup.id}
                            className="px-3 py-1.5 rounded-md bg-success/10 border border-success/20 text-xs text-success hover:bg-success/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {actionLoading === followup.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle size={12} />
                            )}
                            Complete
                          </button>
                          <button
                            onClick={() => updateStatus(followup.id, "skipped")}
                            disabled={actionLoading === followup.id}
                            className="px-3 py-1.5 rounded-md border border-border-default text-xs text-text-secondary hover:bg-bg-hover transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <SkipForward size={12} />
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Flat list for completed/skipped */
        <div className="space-y-2">
          {followups.map((followup) => (
            <div
              key={followup.id}
              className="bg-bg-surface border border-border-default rounded-lg p-4 hover:border-border-focus transition-colors"
            >
              <div className="flex items-start gap-3">
                <Mail size={16} className={`${tab === "completed" ? "text-success" : "text-text-muted"} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-primary">
                      {followup.leads.business_name}
                    </span>
                    <span className="text-xs text-text-muted">{followup.leads.city}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                      {followup.leads.category}
                    </span>
                  </div>
                  {followup.notes && (
                    <p className="text-xs text-text-secondary mt-1">{followup.notes}</p>
                  )}
                  <span className="text-[11px] text-text-muted mt-1 block">
                    Due: {formatDate(followup.due_date)} · {followup.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Follow-up Modal */}
      {showAddForm && (
        <AddFollowUpModal
          onClose={() => setShowAddForm(false)}
          onAdded={() => {
            setShowAddForm(false)
            fetchFollowups()
          }}
        />
      )}
    </div>
  )
}

function AddFollowUpModal({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: () => void
}) {
  const [leadId, setLeadId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<{ id: string; business_name: string; category: string }[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchLeads = async () => {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("leads")
        .select("id, business_name, category")
        .order("business_name")
        .limit(200)
      setLeads((data || []) as { id: string; business_name: string; category: string }[])
    }
    fetchLeads()
  }, [])

  const filteredLeads = leads.filter(
    (l) =>
      l.business_name.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId || !dueDate) {
      setError("Please select a lead and due date")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          due_date: new Date(dueDate).toISOString(),
          notes: notes || null,
          type: "manual",
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create follow-up")
      }
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create follow-up")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border-default rounded-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Add Follow-up</h2>

        {error && (
          <div className="flex items-center gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase text-text-muted font-semibold mb-1">
              Lead *
            </label>
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent mb-2"
            />
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent max-h-40 overflow-y-auto"
            >
              <option value="">Select a lead...</option>
              {filteredLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.business_name} ({l.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-text-muted font-semibold mb-1">
              Due Date *
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase text-text-muted font-semibold mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border-default text-sm text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
