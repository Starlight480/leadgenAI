"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Receipt,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  X,
  Filter,
  Trash2,
} from "lucide-react"
import type { Invoice } from "@/types"

const STATUS_CONFIG = {
  draft: { icon: FileText, color: "text-text-muted", bg: "bg-bg-primary", label: "Draft" },
  sent: { icon: Send, color: "text-info", bg: "bg-info/10", label: "Sent" },
  paid: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Paid" },
  overdue: { icon: AlertCircle, color: "text-error", bg: "bg-error/10", label: "Overdue" },
  cancelled: { icon: X, color: "text-text-muted", bg: "bg-bg-primary", label: "Cancelled" },
} as const

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  onSave: (invoice: Partial<Invoice>) => void
}

function CreateInvoiceModal({ open, onClose, onSave }: CreateInvoiceModalProps) {
  const [form, setForm] = useState({
    business_name: "",
    amount_ngn: "",
    amount_usd: "",
    currency: "NGN" as "NGN" | "USD",
    due_date: "",
    notes: "",
  })

  if (!open) return null

  const handleSubmit = () => {
    if (!form.business_name.trim()) return
    onSave({
      business_name: form.business_name.trim(),
      amount_ngn: form.currency === "NGN" && form.amount_ngn ? Number(form.amount_ngn) : null,
      amount_usd: form.currency === "USD" && form.amount_usd ? Number(form.amount_usd) : null,
      currency: form.currency,
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
      status: "draft",
    })
    setForm({
      business_name: "",
      amount_ngn: "",
      amount_usd: "",
      currency: "NGN",
      due_date: "",
      notes: "",
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-surface border border-border-default rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">New Invoice</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-hover">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Business Name *</label>
            <input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
              placeholder="e.g. Tasty Bite Restaurant"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Currency</label>
            <div className="flex gap-2">
              {(["NGN", "USD"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, currency: c })}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                    form.currency === c
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-default text-text-muted hover:border-border-hover"
                  }`}
                >
                  {c === "NGN" ? "₦ NGN" : "$ USD"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Amount {form.currency === "NGN" ? "₦" : "$"}
            </label>
            <input
              type="number"
              value={form.currency === "NGN" ? form.amount_ngn : form.amount_usd}
              onChange={(e) =>
                form.currency === "NGN"
                  ? setForm({ ...form, amount_ngn: e.target.value })
                  : setForm({ ...form, amount_usd: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
              placeholder={form.currency === "NGN" ? "250000" : "150"}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
              rows={2}
              placeholder="Payment terms, description, etc."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.business_name.trim()}
            className="px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<string>("all")

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices")
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleCreate = async (invoice: Partial<Invoice>) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      })
      if (res.ok) fetchInvoices()
    } catch (err) {
      console.error("Failed to create invoice:", err)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const patch: Record<string, unknown> = { status }
      if (status === "paid") patch.paid_at = new Date().toISOString()
      if (status === "sent") patch.sent_at = new Date().toISOString()
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (res.ok) fetchInvoices()
    } catch (err) {
      console.error("Failed to update invoice:", err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (res.ok) fetchInvoices()
    } catch (err) {
      console.error("Failed to delete invoice:", err)
    }
  }

  const totalNGN = invoices
    .filter((i) => i.currency === "NGN" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.amount_ngn || 0), 0)
  const totalUSD = invoices
    .filter((i) => i.currency === "USD" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.amount_usd || 0), 0)
  const paidNGN = invoices
    .filter((i) => i.currency === "NGN" && i.status === "paid")
    .reduce((sum, i) => sum + (i.amount_ngn || 0), 0)
  const paidUSD = invoices
    .filter((i) => i.currency === "USD" && i.status === "paid")
    .reduce((sum, i) => sum + (i.amount_usd || 0), 0)
  const sentCount = invoices.filter((i) => i.status === "sent").length
  const overdueCount = invoices.filter((i) => i.status === "overdue").length

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoices</h1>
          <p className="text-sm text-text-muted mt-1">Track billing and payments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Invoice</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={14} className="text-text-muted" />
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Total</p>
          </div>
          <p className="text-lg font-bold text-text-primary">
            {totalNGN > 0 && `₦${totalNGN.toLocaleString()}`}
            {totalNGN > 0 && totalUSD > 0 && " + "}
            {totalUSD > 0 && `$${totalUSD.toLocaleString()}`}
            {totalNGN === 0 && totalUSD === 0 && "—"}
          </p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-success" />
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Paid</p>
          </div>
          <p className="text-lg font-bold text-success">
            {paidNGN > 0 && `₦${paidNGN.toLocaleString()}`}
            {paidNGN > 0 && paidUSD > 0 && " + "}
            {paidUSD > 0 && `$${paidUSD.toLocaleString()}`}
            {paidNGN === 0 && paidUSD === 0 && "—"}
          </p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Send size={14} className="text-info" />
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Awaiting</p>
          </div>
          <p className="text-lg font-bold text-info">{sentCount > 0 ? `${sentCount} invoice${sentCount !== 1 ? "s" : ""}` : "—"}</p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-error" />
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Overdue</p>
          </div>
          <p className="text-lg font-bold text-error">{overdueCount > 0 ? `${overdueCount} invoice${overdueCount !== 1 ? "s" : ""}` : "—"}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "draft", "sent", "paid", "overdue"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-accent text-white"
                : "bg-bg-surface border border-border-default text-text-muted hover:text-text-secondary"
            }`}
          >
            {f === "all" ? `All (${invoices.length})` : `${STATUS_CONFIG[f as keyof typeof STATUS_CONFIG].label} (${invoices.filter((i) => i.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Invoice table */}
      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">Loading invoices...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
          <Receipt size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-text-muted">
            {filter === "all" ? "No invoices yet. Create one when a project is ready for billing." : `No ${filter} invoices.`}
          </p>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">Business</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">Due Date</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={inv.id} className="border-b border-border-default last:border-0 hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-text-primary">{inv.business_name}</p>
                        {inv.notes && <p className="text-[11px] text-text-muted mt-0.5 truncate max-w-[200px]">{inv.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                        {inv.currency === "NGN" ? `₦${(inv.amount_ngn || 0).toLocaleString()}` : `$${(inv.amount_usd || 0).toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {inv.status === "draft" && (
                            <button
                              onClick={() => handleStatusChange(inv.id, "sent")}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-info/10 text-info hover:bg-info/20 transition-colors"
                            >
                              Send
                            </button>
                          )}
                          {inv.status === "sent" && (
                            <button
                              onClick={() => handleStatusChange(inv.id, "paid")}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          {inv.status === "overdue" && (
                            <button
                              onClick={() => handleStatusChange(inv.id, "paid")}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          {inv.status !== "cancelled" && inv.status !== "paid" && (
                            <button
                              onClick={() => handleStatusChange(inv.id, "cancelled")}
                              className="px-2 py-1 rounded text-[11px] font-medium text-text-muted hover:bg-bg-hover transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {inv.status === "draft" && (
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="px-2 py-1 rounded text-[11px] font-medium text-error/60 hover:text-error hover:bg-error/10 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border-default">
            {filtered.map((inv) => {
              const cfg = STATUS_CONFIG[inv.status]
              const Icon = cfg.icon
              return (
                <div key={inv.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{inv.business_name}</p>
                      <p className="text-lg font-bold text-text-primary mt-0.5">
                        {inv.currency === "NGN" ? `₦${(inv.amount_ngn || 0).toLocaleString()}` : `$${(inv.amount_usd || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  {inv.due_date && (
                    <p className="text-xs text-text-muted">
                      Due: {new Date(inv.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}

                  <div className="flex items-center gap-1 pt-1">
                    {inv.status === "draft" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(inv.id, "sent")}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-info/10 text-info hover:bg-info/20 transition-colors"
                        >
                          Send
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="px-2 py-1.5 rounded text-xs font-medium text-error/60 hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                    {(inv.status === "sent" || inv.status === "overdue") && (
                      <button
                        onClick={() => handleStatusChange(inv.id, "paid")}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <CreateInvoiceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />
    </div>
  )
}
