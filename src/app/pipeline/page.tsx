"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import type { PipelineEvent } from "@/types"

const agentColors: Record<string, string> = {
  orchestrator: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  scout: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  scribe: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  dev: "bg-accent/15 text-accent border border-accent/20",
  reach: "bg-green-500/15 text-green-400 border border-green-500/20",
  system: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
}

export default function PipelinePage() {
  const [events, setEvents] = useState<PipelineEvent[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("pipeline_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (filter !== "all") {
      query = query.eq("agent", filter)
    }

    const { data } = await query
    setEvents(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pipeline</h1>
          <p className="text-sm text-text-muted mt-1">Real-time agent activity feed</p>
        </div>
        <button
          onClick={fetchEvents}
          className="px-3 py-2 rounded-md border border-border-default text-text-secondary text-sm hover:bg-bg-hover transition-colors flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Agent filter tabs */}
      <div className="flex gap-2 border-b border-border-default pb-3 overflow-x-auto">
        {["all", "orchestrator", "scout", "scribe", "dev", "reach", "system"].map(agent => (
          <button
            key={agent}
            onClick={() => setFilter(agent)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === agent
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
            }`}
          >
            {agent === "all" ? "All Agents" : agent.charAt(0).toUpperCase() + agent.slice(1)}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center text-text-muted text-sm">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
            <Activity size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No pipeline events yet. Run a campaign to see agent activity.</p>
          </div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className="bg-bg-surface border border-border-default rounded-lg p-3 flex items-start gap-3 hover:border-border-focus transition-colors"
            >
              {/* Agent badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${agentColors[event.agent] || agentColors.system}`}>
                {event.agent}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{event.summary}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-text-muted">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                  {event.duration_ms && (
                    <span className="text-[11px] text-text-muted">
                      {(event.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              {event.success ? (
                <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-error mt-0.5 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
