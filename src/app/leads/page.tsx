"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR from "swr"
import {
  Search,
  Download,
  Plus,
  X,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  AtSign,
  Globe,
  ChevronRight,
  ArrowRight,
  StickyNote,
  Star,
  Trash2,
  Building,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import { SkeletonTable } from "@/components/skeleton"
import { EmptyState } from "@/components/error-boundary"
import type { Lead } from "@/types"

const fetcher = async (url: string) => {
  const supabase = createBrowserClient()
  let query = supabase.from("leads").select("*").order("created_at", { ascending: false })

  const u = new URL(url, window.location.origin)
  const status = u.searchParams.get("status")
  const category = u.searchParams.get("category")
  const search = u.searchParams.get("search")

  if (status && status !== "all") query = query.eq("status", status)
  if (category && category !== "all") query = query.eq("category", category)
  if (search) query = query.or(`business_name.ilike.%${search}%,address.ilike.%${search}%`)

  const { data } = await query.limit(100)
  return data || []
}

const STATUS_FLOW = [
  { key: "new", label: "New", color: "#3b82f6" },
  { key: "profiled", label: "Profiled", color: "#06b6d4" },
  { key: "contacted", label: "Contacted", color: "#f59e0b" },
  { key: "interested", label: "Interested", color: "#f97316" },
  { key: "spec_written", label: "Spec Written", color: "#8b5cf6" },
  { key: "site_built", label: "Site Built", color: "#10b981" },
  { key: "closed", label: "Closed", color: "#10b981" },
] as const

const STATUS_MAP = Object.fromEntries(STATUS_FLOW.map((s) => [s.key, s]))

const DEAD_STATUSES = ["dead", "failed"]

export default function LeadsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const swrKey = `/api/leads?status=${statusFilter}&category=${categoryFilter}&search=${search}`
  const { data: leads = [], isLoading: loading, mutate } = useSWR(swrKey, fetcher, {
    dedupingInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    errorRetryCount: 3,
    refreshInterval: 20000,
  })

  const categories = ["all", ...["restaurant", "salon", "barbershop", "supermarket", "hotel", "pharmacy", "church", "other"]]

  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: string) => {
      // Optimistic update
      setSelectedLead((prev) => (prev?.id === leadId ? { ...prev, status: newStatus as Lead["status"] } : prev))
      mutate(
        (prev) => prev?.map((l) => (l.id === leadId ? { ...l, status: newStatus as Lead["status"] } : l)),
        { revalidate: false }
      )

      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) throw new Error("Failed to update status")
        mutate() // revalidate
      } catch {
        mutate() // revert
      }
    },
    [mutate]
  )

  const handlePriorityToggle = useCallback(
    async (lead: Lead) => {
      const newPriority = lead.priority === "high" ? "normal" : "high"
      setSelectedLead((prev) => (prev?.id === lead.id ? { ...prev, priority: newPriority } : prev))
      mutate(
        (prev) => prev?.map((l) => (l.id === lead.id ? { ...l, priority: newPriority } : l)),
        { revalidate: false }
      )

      try {
        await fetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority: newPriority }),
        })
        mutate()
      } catch {
        mutate()
      }
    },
    [mutate]
  )

  const handleNotesUpdate = useCallback(
    async (leadId: string, notes: string) => {
      setSelectedLead((prev) => (prev?.id === leadId ? { ...prev, notes } : prev))
      try {
        await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        })
        mutate()
      } catch {
        mutate()
      }
    },
    [mutate]
  )

  const getNextStatus = (current: string): string | null => {
    const idx = STATUS_FLOW.findIndex((s) => s.key === current)
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1].key
    return null
  }

  const getPrevStatus = (current: string): string | null => {
    const idx = STATUS_FLOW.findIndex((s) => s.key === current)
    if (idx > 0) return STATUS_FLOW[idx - 1].key
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Leads
            {categoryFilter !== "all" && (
              <span className="text-lg text-accent ml-2">— {categoryFilter}</span>
            )}
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            {categoryFilter !== "all"
              ? `${leads.length} ${categoryFilter}s`
              : `${leads.length} total leads`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors flex items-center gap-2 min-h-[44px] shadow-sm"
          >
            <Plus size={14} />
            Add Lead
          </button>
          <button className="px-5 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm hover:bg-bg-hover transition-colors flex items-center gap-2 min-h-[44px]">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const count = cat === "all"
            ? leads.length
            : leads.filter((l) => l.category === cat).length
          const isActive = categoryFilter === cat
          const icons: Record<string, string> = {
            all: "📊",
            restaurant: "🍽️",
            salon: "💇",
            barbershop: "💈",
            supermarket: "🛒",
            hotel: "🏨",
            pharmacy: "💊",
            church: "⛪",
            other: "📁",
          }
          if (cat !== "all" && count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-accent text-white shadow-md"
                  : "bg-bg-surface border border-border-default text-text-secondary hover:bg-bg-hover"
              }`}
            >
              <span>{icons[cat] || "📁"}</span>
              <span className="capitalize">{cat}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/20 text-white" : "bg-bg-primary text-text-muted"
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors min-h-[44px]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent min-h-[44px]"
        >
          <option value="all">All Status</option>
          {STATUS_FLOW.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : leads.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-lg">
          <EmptyState
            icon={Building}
            title="No leads yet"
            description="Add your first lead manually or run a Scout campaign to find businesses without websites."
            action={() => setShowAddForm(true)}
            actionLabel="Add First Lead"
          />
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-primary text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Business</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">Category</th>
                  <th className="px-5 py-3 text-left hidden lg:table-cell">Area</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">Added</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const st = STATUS_MAP[lead.status]
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="border-b border-border-default/50 hover:bg-bg-hover/50 transition-colors cursor-pointer border-l-[3px]"
                      style={{ borderLeftColor: st?.color || "#1a2840" }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{lead.business_name}</p>
                          {lead.priority === "high" && <Star size={12} className="text-warning fill-warning" />}
                        </div>
                        <p className="text-xs text-text-muted truncate max-w-[200px] md:hidden">{lead.address || lead.category}</p>
                        <p className="text-xs text-text-muted truncate max-w-[200px] hidden md:block">{lead.address || "No address"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary hidden md:table-cell">{lead.category}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary hidden lg:table-cell">{lead.area || "—"}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary hidden sm:table-cell">
                        {lead.phone || lead.email || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: `${st?.color || "#6b7280"}20`,
                            color: st?.color || "#6b7280",
                            border: `1px solid ${st?.color || "#6b7280"}30`,
                          }}
                        >
                          {st?.label || lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-text-muted hidden md:table-cell">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
          onPriorityToggle={handlePriorityToggle}
          onNotesUpdate={handleNotesUpdate}
          onNextStatus={getNextStatus}
          onPrevStatus={getPrevStatus}
        />
      )}

      {/* Add Lead Modal */}
      {showAddForm && <AddLeadModal onClose={() => setShowAddForm(false)} onAdded={() => mutate()} />}
    </div>
  )
}

/* ─── Lead Detail Drawer ─── */

function LeadDetailDrawer({
  lead,
  onClose,
  onStatusChange,
  onPriorityToggle,
  onNotesUpdate,
  onNextStatus,
  onPrevStatus,
}: {
  lead: Lead
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
  onPriorityToggle: (lead: Lead) => void
  onNotesUpdate: (id: string, notes: string) => void
  onNextStatus: (status: string) => string | null
  onPrevStatus: (status: string) => string | null
}) {
  const [notes, setNotes] = useState(lead.notes || "")
  const [notesSaved, setNotesSaved] = useState(false)
  const [runningAgent, setRunningAgent] = useState<string | null>(null)
  const [agentResult, setAgentResult] = useState<string | null>(null)
  const [profile, setProfile] = useState<import("@/types").BusinessProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const st = STATUS_MAP[lead.status]
  const next = onNextStatus(lead.status)
  const prev = onPrevStatus(lead.status)
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true)
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      setProfile(data)
      setProfileLoading(false)
    }
    fetchProfile()
  }, [lead.id])
  const runAgent = async (agent: string) => {
    setRunningAgent(agent)
    setAgentResult(null)
    try {
      const url = agent === "scribe"
        ? `/api/agents/scribe/run/${lead.id}`
        : agent === "dev"
        ? `/api/agents/dev/build/${lead.id}`
        : `/api/agents/reach/process/${lead.id}`
      const body = agent === "dev" ? JSON.stringify({ path: "website" }) : undefined
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body } : {}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Agent failed")
      setAgentResult(`${agent} done ✅`)
    } catch (err) {
      setAgentResult(`${agent} failed: ${err instanceof Error ? err.message : "unknown"}`)
    }
    setRunningAgent(null)
  }

  const runPipeline = async () => {
    setRunningAgent("pipeline")
    setAgentResult(null)
    const steps = ["scribe", "dev", "reach"]
    for (const step of steps) {
      try {
        setAgentResult(`Running ${step}...`)
        const url = step === "dev"
          ? `/api/agents/dev/build/${lead.id}`
          : `/api/agents/${step}/run/${lead.id}`
        const body = step === "dev" ? JSON.stringify({ path: "website" }) : undefined
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          ...(body ? { body } : {}),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `${step} failed`)
      } catch (err) {
        setAgentResult(`Pipeline stopped at ${step}: ${err instanceof Error ? err.message : "unknown"}`)
        setRunningAgent(null)
        return
      }
    }
    setAgentResult("Full pipeline complete ✅")
    setRunningAgent(null)
  }

  const saveNotes = () => {
    onNotesUpdate(lead.id, notes)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-bg-surface border-l border-border-default shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-default sticky top-0 bg-bg-surface z-10">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-text-primary truncate">{lead.business_name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {st && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
                  style={{ backgroundColor: `${st.color}20`, color: st.color, border: `1px solid ${st.color}30` }}
                >
                  {st.label}
                </span>
              )}
              <span className="text-[11px] text-text-muted">{lead.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Status Flow */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Pipeline</p>
            <div className="flex items-center gap-1.5">
              {prev && (
                <button
                  onClick={() => onStatusChange(lead.id, prev)}
                  className="px-3 py-1.5 rounded-md border border-border-default text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
                >
                  ← {STATUS_MAP[prev]?.label}
                </button>
              )}
              <div
                className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-semibold"
                style={{ backgroundColor: `${st?.color || "#6b7280"}20`, color: st?.color || "#6b7280" }}
              >
                {st?.label || lead.status}
              </div>
              {next && (
                <button
                  onClick={() => onStatusChange(lead.id, next)}
                  className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors flex items-center gap-1"
                >
                  {STATUS_MAP[next]?.label} <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Contact</p>
            <div className="grid grid-cols-4 gap-3">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-border-default hover:bg-bg-hover hover:shadow-sm transition-all duration-150 min-h-[44px]"
                >
                  <Phone size={16} className="text-success" />
                  <span className="text-[11px] text-text-muted">Call</span>
                </a>
              )}
              {lead.phone && (
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-border-default hover:bg-bg-hover hover:shadow-sm transition-all duration-150 min-h-[44px]"
                >
                  <MessageCircle size={16} className="text-success" />
                  <span className="text-[11px] text-text-muted">WhatsApp</span>
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-border-default hover:bg-bg-hover hover:shadow-sm transition-all duration-150 min-h-[44px]"
                >
                  <Mail size={16} className="text-info" />
                  <span className="text-[11px] text-text-muted">Email</span>
                </a>
              )}
              {lead.instagram && (
                <a
                  href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-border-default hover:bg-bg-hover hover:shadow-sm transition-all duration-150 min-h-[44px]"
                >
                  <AtSign size={16} className="text-pink-500" />
                  <span className="text-[11px] text-text-muted">Instagram</span>
                </a>
              )}
            </div>
          </div>

          {/* Business Info */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Details</p>
            <div className="space-y-2">
              {lead.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-text-muted mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-text-secondary">{lead.address}</p>
                </div>
              )}
              {lead.area && (
                <div className="flex items-center gap-2">
                  <Building size={13} className="text-text-muted flex-shrink-0" />
                  <p className="text-sm text-text-secondary">{lead.area}, {lead.city}</p>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-text-muted flex-shrink-0" />
                  <p className="text-sm text-text-secondary">{lead.phone}</p>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-text-muted flex-shrink-0" />
                  <p className="text-sm text-text-secondary">{lead.email}</p>
                </div>
              )}
              {lead.instagram && (
                <div className="flex items-center gap-2">
                  <AtSign size={13} className="text-text-muted flex-shrink-0" />
                  <p className="text-sm text-text-secondary">{lead.instagram}</p>
                </div>
              )}
              {lead.website_url && (
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-text-muted flex-shrink-0" />
                  <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:text-accent-hover">
                    {lead.website_url}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Priority + Meta */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Priority & Meta</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPriorityToggle(lead)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  lead.priority === "high"
                    ? "border-warning bg-warning/10 text-warning"
                    : "border-border-default text-text-muted hover:bg-bg-hover"
                }`}
              >
                <Star size={12} className={lead.priority === "high" ? "fill-warning" : ""} />
                {lead.priority === "high" ? "High Priority" : "Normal"}
              </button>
              <span className="text-[11px] text-text-muted">
                Source: {lead.source}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-text-muted">
              Added {new Date(lead.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Agent Actions */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Agent Actions</p>
            <button
              onClick={runPipeline}
              disabled={!!runningAgent}
              className="w-full mb-3 px-4 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {runningAgent === "pipeline" ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>▶ Run Full Pipeline</>
              )}
            </button>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => runAgent("scribe")}
                disabled={!!runningAgent}
                className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-border-default hover:border-accent/40 hover:bg-bg-hover hover:shadow-sm transition-all duration-150 disabled:opacity-50 min-h-[44px]"
              >
                {runningAgent === "scribe" ? (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-lg">✍️</span>
                )}
                <span className="text-[11px] text-text-muted">Scribe</span>
                <span className="text-[9px] text-text-muted">Profile</span>
              </button>
              <button
                onClick={() => runAgent("dev")}
                disabled={!!runningAgent}
                className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-border-default hover:border-accent/40 hover:bg-bg-hover hover:shadow-sm transition-all duration-150 disabled:opacity-50 min-h-[44px]"
              >
                {runningAgent === "dev" ? (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-lg">🛠️</span>
                )}
                <span className="text-[11px] text-text-muted">Dev</span>
                <span className="text-[9px] text-text-muted">Build Spec</span>
              </button>
              <button
                onClick={() => runAgent("reach")}
                disabled={!!runningAgent}
                className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-border-default hover:border-accent/40 hover:bg-bg-hover hover:shadow-sm transition-all duration-150 disabled:opacity-50 min-h-[44px]"
              >
                {runningAgent === "reach" ? (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-lg">📧</span>
                )}
                <span className="text-[11px] text-text-muted">Reach</span>
                <span className="text-[9px] text-text-muted">Outreach</span>
              </button>
            </div>
            {agentResult && (
              <p className={`text-xs mt-2 ${agentResult.includes("✅") ? "text-success" : "text-error"}`}>
                {agentResult}
              </p>
            )}
          </div>

          {/* Business Profile */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Business Profile</p>
            {profileLoading ? (
              <div className="p-4 text-center text-text-muted text-xs">Loading profile...</div>
            ) : profile ? (
              <div className="space-y-3">
                {profile.business_summary && (
                  <div>
                    <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Summary</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{profile.business_summary}</p>
                  </div>
                )}
                {profile.target_audience && (
                  <div>
                    <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Target Audience</p>
                    <p className="text-sm text-text-secondary">{profile.target_audience}</p>
                  </div>
                )}
                {profile.estimated_size && (
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase text-text-muted font-semibold">Size:</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent capitalize">{profile.estimated_size}</span>
                  </div>
                )}
                {profile.website_pitch && (
                  <div>
                    <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Website Pitch</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{profile.website_pitch}</p>
                  </div>
                )}
                {profile.recommended_pages && profile.recommended_pages.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase text-text-muted font-semibold mb-1.5">Recommended Pages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.recommended_pages.map((page) => (
                        <span key={page} className="text-[11px] px-2 py-0.5 rounded-full border border-border-default text-text-secondary">{page}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.color_notes || profile.tone_notes) && (
                  <div className="grid grid-cols-2 gap-3">
                    {profile.color_notes && (
                      <div>
                        <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Colors</p>
                        <p className="text-xs text-text-secondary">{profile.color_notes}</p>
                      </div>
                    )}
                    {profile.tone_notes && (
                      <div>
                        <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Tone</p>
                        <p className="text-xs text-text-secondary">{profile.tone_notes}</p>
                      </div>
                    )}
                  </div>
                )}
                {(profile.price_recommendation_ngn || profile.price_recommendation_usd) && (
                  <div className="bg-bg-primary rounded-md p-3 border border-border-default">
                    <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Price Recommendation</p>
                    <div className="flex items-center gap-3">
                      {profile.price_recommendation_ngn && (
                        <span className="text-sm font-semibold text-success">₦{profile.price_recommendation_ngn.toLocaleString()}</span>
                      )}
                      {profile.price_recommendation_usd && (
                        <span className="text-sm font-semibold text-success">${profile.price_recommendation_usd.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-bg-primary rounded-lg border border-border-default text-center">
                <p className="text-sm text-text-muted mb-2">No profile yet — run Scribe</p>
                <button
                  onClick={() => runAgent("scribe")}
                  disabled={!!runningAgent}
                  className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  ✍️ Run Scribe
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
                <StickyNote size={12} /> Notes
              </p>
              {notesSaved && <span className="text-[11px] text-success">Saved</span>}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={3}
              placeholder="Add notes about this lead..."
              className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent resize-none placeholder:text-text-muted min-h-[48px]"
            />
          </div>

          {/* Danger zone */}
          <div className="pt-2 border-t border-border-default">
            <button
              onClick={async () => {
                if (confirm("Mark this lead as dead?")) {
                  await onStatusChange(lead.id, "dead")
                  onClose()
                }
              }}
              className="flex items-center gap-1.5 text-xs text-error/60 hover:text-error transition-colors"
            >
              <Trash2 size={12} />
              Mark as Dead
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Add Lead Modal ─── */

function AddLeadModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    business_name: "",
    category: "",
    city: "Lagos",
    area: "",
    address: "",
    phone: "",
    email: "",
    instagram: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.business_name || !form.category) return
    setSaving(true)

    const supabase = createBrowserClient()
    await supabase.from("leads").insert({
      business_name: form.business_name,
      category: form.category,
      city: form.city,
      area: form.area || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      instagram: form.instagram || null,
      notes: form.notes || null,
      source: "manual",
      status: "new",
      priority: "normal",
      lead_type: "website_build",
      pipeline_stage: "discovered",
    })

    setSaving(false)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-default sticky top-0 bg-bg-surface z-10">
          <h2 className="text-lg font-bold text-text-primary">Add Lead</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Business Name *</label>
            <input
              type="text"
              required
              value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Category *</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent"
            >
              <option value="">Select category</option>
              <option value="restaurant">Restaurant</option>
              <option value="salon">Salon</option>
              <option value="barbershop">Barbershop</option>
              <option value="hotel">Hotel</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="church">Church</option>
              <option value="supermarket">Supermarket</option>
              <option value="auto_repair">Auto Repair</option>
              <option value="school">School</option>
              <option value="event_venue">Event Venue</option>
              <option value="real_estate">Real Estate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Area</label>
              <input
                type="text"
                placeholder="e.g. Lekki"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Instagram</label>
            <input
              type="text"
              placeholder="@handle"
              value={form.instagram}
              onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent resize-none min-h-[48px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border-default text-text-secondary text-sm hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {saving ? "Saving…" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
