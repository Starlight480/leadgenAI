"use client"

import { Send, Copy } from "lucide-react"

export default function OutreachPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Outreach</h1>
        <p className="text-sm text-text-muted mt-1">Manage manual outreach and sent emails</p>
      </div>

      <div className="flex gap-4 border-b border-border-default">
        <button className="px-4 py-2 text-sm font-medium text-accent border-b-2 border-accent">
          Manual Queue
        </button>
        <button className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
          Sent Emails
        </button>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
        <Send size={32} className="text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">No outreach items yet. Run a campaign to generate outreach tasks.</p>
      </div>
    </div>
  )
}
