"use client"

import { Code } from "lucide-react"

const columns = ["Spec Written", "Approved", "In Progress", "Review", "Live"]

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <p className="text-sm text-text-muted mt-1">Track website builds from spec to live</p>
      </div>

      {/* Mobile: vertical stack. Desktop: horizontal kanban */}
      <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-4">
        {columns.map(col => (
          <div key={col} className="w-full md:min-w-[260px] md:flex-1">
            <div className="bg-bg-surface border border-border-default rounded-lg">
              <div className="px-4 py-3 border-b border-border-default">
                <h3 className="text-sm font-semibold text-text-primary">{col}</h3>
                <p className="text-[11px] text-text-muted mt-0.5">0 projects</p>
              </div>
              <div className="p-4">
                <div className="text-center py-8">
                  <Code size={24} className="text-text-muted mx-auto mb-2" />
                  <p className="text-xs text-text-muted">No projects</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
