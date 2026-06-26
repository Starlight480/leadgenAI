"use client"

import { Search, Plus } from "lucide-react"

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campaigns</h1>
          <p className="text-sm text-text-muted mt-1">Manage your lead discovery campaigns</p>
        </div>
        <button className="px-4 py-2 rounded-md bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2">
          <Plus size={14} />
          New Campaign
        </button>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
        <Search size={32} className="text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">No campaigns yet. Create your first campaign to start finding leads.</p>
      </div>
    </div>
  )
}
