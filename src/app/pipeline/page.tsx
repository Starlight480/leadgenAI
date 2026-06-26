"use client"

import { Activity } from "lucide-react"

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Pipeline</h1>
        <p className="text-sm text-text-muted mt-1">Real-time agent activity feed</p>
      </div>

      <div className="flex gap-4 border-b border-border-default">
        {["All", "Orchestrator", "Scout", "Scribe", "Dev", "Reach"].map(agent => (
          <button
            key={agent}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            {agent}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
        <Activity size={32} className="text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">No pipeline events yet. Run a campaign to see agent activity here.</p>
      </div>
    </div>
  )
}
