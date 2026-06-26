"use client"

import { Receipt } from "lucide-react"

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoices</h1>
          <p className="text-sm text-text-muted mt-1">Track billing and payments</p>
        </div>
        <button className="px-4 py-2 rounded-md border border-border-default text-text-secondary text-sm hover:bg-bg-hover transition-colors">
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Draft", value: "₦0", color: "text-text-muted" },
          { label: "Sent", value: "₦0", color: "text-info" },
          { label: "Paid", value: "₦0", color: "text-success" },
          { label: "Overdue", value: "₦0", color: "text-error" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg-surface border border-border-default rounded-lg p-4">
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
        <Receipt size={32} className="text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">No invoices yet. Create one when a project is ready for billing.</p>
      </div>
    </div>
  )
}
