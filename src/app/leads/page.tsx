"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, Download, Plus, X, Phone, Mail, MessageCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import type { Lead } from "@/types"

const statusColors: Record<string, string> = {
  new: "#3b82f6",
  profiled: "#06b6d4",
  spec_written: "#8b5cf6",
  site_built: "#10b981",
  contacted: "#f59e0b",
  interested: "#f97316",
  closed: "#10b981",
  dead: "#6b7280",
  failed: "#ef4444",
}

const statusLabels: Record<string, string> = {
  new: "New",
  profiled: "Profiled",
  spec_written: "Spec Written",
  site_built: "Site Built",
  contacted: "Contacted",
  interested: "Interested",
  closed: "Closed",
  dead: "Dead",
  failed: "Failed",
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient()

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false })

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }
    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter)
    }
    if (search) {
      query = query.or(`business_name.ilike.%${search}%,address.ilike.%${search}%`)
    }

    const { data } = await query.limit(100)
    setLeads(data || [])
    setLoading(false)
  }, [search, statusFilter, categoryFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const categories = [...new Set(leads.map(l => l.category))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Leads</h1>
          <p className="text-sm text-text-muted mt-1">{leads.length} total leads</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-md bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <Plus size={14} />
            Add Lead
          </button>
          <button className="px-4 py-2 rounded-md border border-border-default text-text-secondary text-sm hover:bg-bg-hover transition-colors flex items-center gap-2">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent"
        >
          <option value="all">All Status</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-primary text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">Business</th>
                <th className="px-4 py-2.5 text-left">Category</th>
                <th className="px-4 py-2.5 text-left">Area</th>
                <th className="px-4 py-2.5 text-left">Contact</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Added</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">
                    No leads found. Add your first lead or run a campaign.
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-border-default/50 hover:bg-bg-hover/50 transition-colors cursor-pointer border-l-[3px]"
                    style={{ borderLeftColor: statusColors[lead.status] || "#1a2840" }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">{lead.business_name}</p>
                      <p className="text-xs text-text-muted truncate max-w-[200px]">{lead.address || "No address"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{lead.category}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{lead.area || "—"}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {lead.phone || lead.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: `${statusColors[lead.status]}20`,
                          color: statusColors[lead.status],
                          border: `1px solid ${statusColors[lead.status]}30`,
                        }}
                      >
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedLead(null)} />
          <div className="absolute right-0 top-0 h-full w-[420px] bg-bg-elevated border-l border-border-default shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h2 className="text-lg font-bold text-text-primary">{selectedLead.business_name}</h2>
              <button onClick={() => setSelectedLead(null)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4 flex-1">
              <div className="flex gap-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: `${statusColors[selectedLead.status]}20`,
                    color: statusColors[selectedLead.status],
                    border: `1px solid ${statusColors[selectedLead.status]}30`,
                  }}
                >
                  {statusLabels[selectedLead.status]}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                  {selectedLead.category}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Address</p>
                  <p className="text-sm text-text-secondary">{selectedLead.address || "No address"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Phone</p>
                  <p className="text-sm text-text-secondary">{selectedLead.phone || "No phone"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</p>
                  <p className="text-sm text-text-secondary">{selectedLead.email || "No email"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Instagram</p>
                  <p className="text-sm text-text-secondary">{selectedLead.instagram || "No Instagram"}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-border-default pt-4">
                <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">Quick Actions</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedLead.phone && (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border-default hover:bg-bg-hover transition-colors"
                    >
                      <Phone size={16} className="text-success" />
                      <span className="text-[11px] text-text-muted">Call</span>
                    </a>
                  )}
                  {selectedLead.email && (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border-default hover:bg-bg-hover transition-colors"
                    >
                      <Mail size={16} className="text-info" />
                      <span className="text-[11px] text-text-muted">Email</span>
                    </a>
                  )}
                  {selectedLead.phone && (
                    <a
                      href={`https://wa.me/${selectedLead.phone?.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border-default hover:bg-bg-hover transition-colors"
                    >
                      <MessageCircle size={16} className="text-success" />
                      <span className="text-[11px] text-text-muted">WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {selectedLead.notes && (
                <div className="border-t border-border-default pt-4">
                  <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1">Notes</p>
                  <p className="text-sm text-text-secondary">{selectedLead.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddForm && (
        <AddLeadModal onClose={() => setShowAddForm(false)} onAdded={fetchLeads} />
      )}
    </div>
  )
}

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
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-elevated border border-border-default rounded-lg shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">Add Lead</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Business Name *</label>
            <input
              type="text"
              required
              value={form.business_name}
              onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Category *</label>
            <select
              required
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
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
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Area</label>
              <input
                type="text"
                placeholder="e.g. Lekki"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Instagram</label>
            <input
              type="text"
              placeholder="@handle"
              value={form.instagram}
              onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border-default bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
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
              className="px-4 py-2 rounded-md bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
