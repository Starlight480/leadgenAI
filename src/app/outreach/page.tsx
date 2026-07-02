"use client"

import { useState, useEffect, useCallback } from "react"
import { Send, Copy, CheckCircle, Phone, MessageCircle, Reply, Mail } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import type { OutreachItem } from "@/types"

type OutreachWithLead = OutreachItem & {
  leads?: { business_name: string; phone: string | null; email: string | null }
}

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

const statusStyles: Record<string, string> = {
  replied: "bg-success/10 text-success border border-success/20",
  sent: "bg-info/10 text-info border border-info/20",
  manual_required: "bg-warning/10 text-warning border border-warning/20",
  pending: "bg-warning/10 text-warning border border-warning/20",
  delivered: "bg-info/10 text-info border border-info/20",
  failed: "bg-error/10 text-error border border-error/20",
  complained: "bg-error/10 text-error border border-error/20",
}

export default function OutreachPage() {
  const [items, setItems] = useState<OutreachItem[]>([])
  const [tab, setTab] = useState<"manual" | "sent" | "replied">("manual")
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [markingReplyId, setMarkingReplyId] = useState<string | null>(null)
  const [confirmReplyId, setConfirmReplyId] = useState<string | null>(null)

  const supabase = createBrowserClient()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("outreach")
        .select("*, leads!inner(business_name, phone, email)")
        .order("created_at", { ascending: true })

      if (tab === "manual") {
        query = query.eq("requires_manual", true).eq("status", "pending")
      } else if (tab === "sent") {
        query = query.eq("status", "sent")
      } else {
        query = query.eq("status", "replied")
      }

      const { data, error } = await query
      if (error) {
        console.error("Failed to fetch outreach:", error)
        setItems([])
      } else {
        setItems((data || []) as OutreachWithLead[])
      }
    } catch (err) {
      console.error("Outreach fetch error:", err)
      setItems([])
    }
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
    await supabase.from("outreach").update({ status: "sent" }).eq("id", id)
    fetchItems()
  }

  const markAsReply = async (id: string) => {
    setMarkingReplyId(id)
    try {
      const res = await fetch(`/api/outreach/${id}/mark-reply`, { method: "POST" })
      if (res.ok) {
        fetchItems()
      } else {
        console.error("Failed to mark as reply")
      }
    } finally {
      setMarkingReplyId(null)
      setConfirmReplyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Outreach</h1>
        <p className="text-sm text-text-muted mt-1">Manage outreach, track replies, and update leads</p>
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
          Manual Queue
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
        <button
          onClick={() => setTab("replied")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === "replied"
              ? "text-success border-success"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          <Reply size={14} />
          Replied
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
                : tab === "sent"
                ? "No sent emails yet."
                : "No replies yet. Replies will appear here as they come in."}
            </p>
          </div>
        ) : (
          items.map(item => {
            const Icon = channelIcons[item.channel] || Send
            const isReplied = item.status === "replied"
            const isReplying = markingReplyId === item.id
            const isConfirming = confirmReplyId === item.id

            return (
              <div
                key={item.id}
                className={`bg-bg-surface border rounded-lg p-4 transition-colors ${
                  isReplied
                    ? "border-success/30 bg-success/5"
                    : "border-border-default hover:border-border-focus"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={16} className={`${channelColors[item.channel] || "text-text-muted"} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary">{(item as OutreachWithLead).leads?.business_name || "Unknown"}</span>
                      {item.subject && (
                        <span className="text-xs text-text-muted truncate max-w-[200px]">— {item.subject}</span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                        {item.channel.replace(/_/g, " ")}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${statusStyles[item.status] || statusStyles.pending}`}>
                        {isReplied ? "✓ Replied" : item.status}
                      </span>
                    </div>
                    {item.recipient && (
                      <p className="text-xs text-text-muted mt-1">To: {item.recipient}</p>
                    )}
                    {item.requires_manual && item.manual_reason && (
                      <p className="text-xs text-warning mt-1">⚠ {item.manual_reason}</p>
                    )}

                    <div className="mt-2 bg-bg-primary rounded-md p-3 text-sm text-text-secondary whitespace-pre-wrap">
                      {item.message}
                    </div>

                    {/* Reply content (if replied) */}
                    {isReplied && item.response_text && (
                      <div className="mt-2 bg-success/5 border border-success/20 rounded-md p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Mail size={12} className="text-success" />
                          <span className="text-xs font-medium text-success">Reply received</span>
                          {item.response_at && (
                            <span className="text-[11px] text-text-muted ml-auto">
                              {new Date(item.response_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{item.response_text}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
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

                      {/* Mark as Reply button (shown for sent items that aren't already replied) */}
                      {tab === "sent" && !isReplied && (
                        <>
                          {isConfirming ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted">Mark this as a reply?</span>
                              <button
                                onClick={() => markAsReply(item.id)}
                                disabled={isReplying}
                                className="px-3 py-1.5 rounded-md bg-success text-white text-xs font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
                              >
                                {isReplying ? "Saving..." : "Yes, Reply"}
                              </button>
                              <button
                                onClick={() => setConfirmReplyId(null)}
                                className="px-3 py-1.5 rounded-md border border-border-default text-xs text-text-muted hover:bg-bg-hover transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmReplyId(item.id)}
                              className="px-3 py-1.5 rounded-md bg-success/10 border border-success/20 text-xs text-success hover:bg-success/20 transition-colors flex items-center gap-1"
                            >
                              <Reply size={12} />
                              Mark as Reply
                            </button>
                          )}
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
