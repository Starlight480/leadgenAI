"use client"

import { useState, useEffect, useCallback } from "react"
import { Send, Copy, CheckCircle, Phone, MessageCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import type { OutreachItem } from "@/types"

const channelIcons: Record<string, typeof Send> = {
  email: Send,
  whatsapp: MessageCircle,
  instagram_dm: Send,
  phone_call: Phone,
}

const channelColors: Record<string, string> = {
  email: "text-info",
  whatsapp: "text-success",
  instagram_dm: "text-purple-400",
  phone_call: "text-warning",
}

export default function OutreachPage() {
  const [items, setItems] = useState<OutreachItem[]>([])
  const [tab, setTab] = useState<"manual" | "sent">("manual")
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const supabase = createBrowserClient()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("outreach_queue")
      .select("*")
      .order("created_at", { ascending: true })

    if (tab === "manual") {
      query = query.eq("requires_manual", true).eq("status", "manual_required")
    } else {
      query = query.eq("status", "sent")
    }

    const { data } = await query
    setItems(data || [])
    setLoading(false)
  }, [tab])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const copyMessage = (message: string, id: string) => {
    navigator.clipboard.writeText(message)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const markDone = async (id: string) => {
    await supabase.from("outreach_queue").update({ status: "manual_done" }).eq("id", id)
    fetchItems()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Outreach</h1>
        <p className="text-sm text-text-muted mt-1">Manage manual outreach and sent emails</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-default">
        <button
          onClick={() => setTab("manual")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "manual"
              ? "text-accent border-accent"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          Manual Queue {items.length > 0 && `(${items.length})`}
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "sent"
              ? "text-accent border-accent"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          Sent Emails
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center text-text-muted text-sm">
            Loading outreach items...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
            <Send size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">
              {tab === "manual"
                ? "No manual outreach items. Run a campaign to generate outreach tasks."
                : "No sent emails yet."}
            </p>
          </div>
        ) : (
          items.map(item => {
            const Icon = channelIcons[item.channel] || Send
            return (
              <div
                key={item.id}
                className="bg-bg-surface border border-border-default rounded-lg p-4 hover:border-border-focus transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon size={16} className={`${channelColors[item.channel] || "text-text-muted"} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{item.recipient}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                        {item.channel.replace(/_/g, " ")}
                      </span>
                    </div>
                    {item.subject && (
                      <p className="text-xs text-text-muted mt-1">Subject: {item.subject}</p>
                    )}
                    <div className="mt-2 bg-bg-primary rounded-md p-3 text-sm text-text-secondary whitespace-pre-wrap">
                      {item.message}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {tab === "manual" && (
                        <>
                          <button
                            onClick={() => copyMessage(item.message, item.id)}
                            className="px-3 py-1.5 rounded-md border border-border-default text-xs text-text-secondary hover:bg-bg-hover transition-colors flex items-center gap-1"
                          >
                            {copiedId === item.id ? <CheckCircle size={12} className="text-success" /> : <Copy size={12} />}
                            {copiedId === item.id ? "Copied!" : "Copy Message"}
                          </button>
                          <button
                            onClick={() => markDone(item.id)}
                            className="px-3 py-1.5 rounded-md bg-success/10 border border-success/20 text-xs text-success hover:bg-success/20 transition-colors"
                          >
                            Mark Done
                          </button>
                        </>
                      )}
                      <span className="text-[11px] text-text-muted">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
