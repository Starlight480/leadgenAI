"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Code,
  Plus,
  ExternalLink,
  GitBranch,
  DollarSign,
  ChevronRight,
  X,
  GripVertical,
} from "lucide-react"
import type { Project } from "@/types"
import { createBrowserClient } from "@/lib/supabase"

const STATUSES = [
  { key: "spec_written", label: "Spec Written", color: "text-info" },
  { key: "approved", label: "Approved", color: "text-success" },
  { key: "in_progress", label: "In Progress", color: "text-accent" },
  { key: "review", label: "Review", color: "text-warning" },
  { key: "live", label: "Live", color: "text-success" },
] as const

interface ProjectCardProps {
  project: Project
  onMove: (id: string, newStatus: string) => void
  nextStatus?: string
  nextLabel?: string
  onClick?: (project: Project) => void
}

function ProjectCard({ project, onMove, nextStatus, nextLabel, onClick }: ProjectCardProps) {
  return (
    <div
      className="bg-bg-primary border border-border-default rounded-lg p-3 hover:border-accent transition-colors group cursor-pointer"
      onClick={() => onClick?.(project)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-text-primary leading-tight">
          {project.business_name}
        </h4>
        {nextStatus && (
          <button
            onClick={() => onMove(project.id, nextStatus)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-bg-hover transition-all"
            title={`Move to ${nextLabel}`}
          >
            <ChevronRight size={14} className="text-text-muted" />
          </button>
        )}
      </div>

      {project.category && (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent mb-2">
          {project.category}
        </span>
      )}

      <div className="space-y-1.5">
        {(project.price_ngn || project.price_usd) && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <DollarSign size={12} className="text-success" />
            {project.price_ngn
              ? `₦${project.price_ngn.toLocaleString()}`
              : `$${project.price_usd}`}
            {project.deposit_paid && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-success/10 text-success">
                deposit paid
              </span>
            )}
          </div>
        )}

        {project.repo_url && (
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
          >
            <GitBranch size={11} />
            Repo
            <ExternalLink size={9} />
          </a>
        )}

        {project.live_url && (
          <a
            href={project.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-success hover:text-success/80 transition-colors"
          >
            <ExternalLink size={11} />
            Live site
          </a>
        )}

        {project.staging_url && (
          <a
            href={project.staging_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
          >
            <ExternalLink size={11} />
            Staging
          </a>
        )}
      </div>

      {project.dev_notes && (
        <p className="text-[11px] text-text-muted mt-2 line-clamp-2 italic">
          {project.dev_notes}
        </p>
      )}
    </div>
  )
}


/* ─── Project Detail Modal ─── */

function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [spec, setSpec] = useState<import("@/types").Spec | null>(null)
  const [specLoading, setSpecLoading] = useState(true)

  useEffect(() => {
    const fetchSpec = async () => {
      if (!project.spec_id) { setSpecLoading(false); return }
      setSpecLoading(true)
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("specs")
        .select("*")
        .eq("id", project.spec_id)
        .single()
      setSpec(data)
      setSpecLoading(false)
    }
    fetchSpec()
  }, [project.spec_id])

  const pages = spec?.pages as Record<string, unknown> | null
  const colorPalette = spec?.color_palette as Record<string, string> | null
  const content = spec?.content as Record<string, unknown> | null
  const services = (content?.services as string[]) || []

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default sticky top-0 bg-bg-surface z-10">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{project.business_name}</h2>
            <p className="text-xs text-text-muted">{project.category || "No category"} — {project.status?.replace(/_/g, " ")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* URLs */}
          <div className="flex flex-wrap gap-3">
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-success/30 bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
                <ExternalLink size={12} /> Live Site
              </a>
            )}
            {project.staging_url && (
              <a href={project.staging_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
                <ExternalLink size={12} /> Staging
              </a>
            )}
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
                <GitBranch size={12} /> Repository
              </a>
            )}
          </div>

          {/* Pricing */}
          {(project.price_ngn || project.price_usd) && (
            <div className="bg-bg-primary rounded-lg p-3 border border-border-default">
              <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Pricing</p>
              <div className="flex items-center gap-4">
                {project.price_ngn && <span className="text-lg font-bold text-success">₦{project.price_ngn.toLocaleString()}</span>}
                {project.price_usd && <span className="text-lg font-bold text-success">${project.price_usd}</span>}
                {project.deposit_paid && <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">Deposit Paid</span>}
              </div>
            </div>
          )}

          {/* Spec Details */}
          {specLoading ? (
            <div className="text-center py-6 text-text-muted text-sm">Loading spec...</div>
          ) : spec ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-text-muted font-semibold">Site Type:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{spec.site_type}</span>
              </div>

              {pages && Object.keys(pages).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-semibold mb-2">Pages</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(pages).map(([name, detail]) => (
                      <div key={name} className="text-xs px-2 py-1.5 rounded bg-bg-primary border border-border-default text-text-secondary">
                        <span className="font-medium text-text-primary">{name}</span>
                        {typeof detail === "string" && <span className="text-text-muted ml-1">— {detail}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {colorPalette && Object.keys(colorPalette).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-semibold mb-2">Color Palette</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(colorPalette).map(([name, hex]) => (
                      <div key={name} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full border border-border-default" style={{ backgroundColor: hex }} />
                        <span className="text-[11px] text-text-muted">{name}: {hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase text-text-muted font-semibold">Content</p>
                  {typeof content.hero_headline === "string" && (
                    <div>
                      <p className="text-[10px] text-text-muted font-semibold">Hero Headline</p>
                      <p className="text-sm text-text-primary font-medium">{content.hero_headline}</p>
                    </div>
                  )}
                  {typeof content.about_text === "string" && (
                    <div>
                      <p className="text-[10px] text-text-muted font-semibold">About</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{content.about_text.slice(0, 200)}{content.about_text.length > 200 ? "..." : ""}</p>
                    </div>
                  )}
                  {services.length > 0 && (
                    <div>
                      <p className="text-[10px] text-text-muted font-semibold mb-1">Services</p>
                      <div className="flex flex-wrap gap-1.5">
                        {services.map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border border-border-default text-text-secondary">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {typeof content.contact_text === "string" && (
                    <div>
                      <p className="text-[10px] text-text-muted font-semibold">Contact</p>
                      <p className="text-xs text-text-secondary">{content.contact_text}</p>
                    </div>
                  )}
                  {typeof content.cta_text === "string" && (
                    <div>
                      <p className="text-[10px] text-text-muted font-semibold">CTA</p>
                      <span className="text-xs px-3 py-1 rounded-md bg-accent text-white">{content.cta_text}</span>
                    </div>
                  )}
                </div>
              )}

              {spec.tech_stack && spec.tech_stack.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-semibold mb-1.5">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {spec.tech_stack.map((tech) => (
                      <span key={tech} className="text-[11px] px-2 py-0.5 rounded-full bg-info/10 text-info border border-info/20">{tech}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-text-muted text-sm">No spec found for this project.</div>
          )}

          {project.dev_notes && (
            <div>
              <p className="text-[10px] uppercase text-text-muted font-semibold mb-1">Dev Notes</p>
              <p className="text-xs text-text-secondary leading-relaxed italic">{project.dev_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  onSave: (project: Partial<Project>) => void
}

function CreateProjectModal({ open, onClose, onSave }: CreateProjectModalProps) {
  const [form, setForm] = useState({
    business_name: "",
    category: "",
    price_ngn: "",
    price_usd: "",
    deposit_paid: false,
    repo_url: "",
    live_url: "",
    staging_url: "",
    dev_notes: "",
  })

  if (!open) return null

  const handleSubmit = () => {
    if (!form.business_name.trim()) return
    onSave({
      business_name: form.business_name.trim(),
      category: form.category.trim() || null,
      price_ngn: form.price_ngn ? Number(form.price_ngn) : null,
      price_usd: form.price_usd ? Number(form.price_usd) : null,
      deposit_paid: form.deposit_paid,
      repo_url: form.repo_url.trim() || null,
      live_url: form.live_url.trim() || null,
      staging_url: form.staging_url.trim() || null,
      dev_notes: form.dev_notes.trim() || null,
      status: "spec_written",
    })
    setForm({
      business_name: "",
      category: "",
      price_ngn: "",
      price_usd: "",
      deposit_paid: false,
      repo_url: "",
      live_url: "",
      staging_url: "",
      dev_notes: "",
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-surface border border-border-default rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">New Project</h2>
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
            <label className="block text-xs font-semibold text-text-muted mb-1">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
              placeholder="e.g. Restaurant, Salon, Pharmacy"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Price (₦)</label>
              <input
                type="number"
                value={form.price_ngn}
                onChange={(e) => setForm({ ...form, price_ngn: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
                placeholder="250000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Price ($)</label>
              <input
                type="number"
                value={form.price_usd}
                onChange={(e) => setForm({ ...form, price_usd: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
                placeholder="150"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.deposit_paid}
              onChange={(e) => setForm({ ...form, deposit_paid: e.target.checked })}
              className="rounded border-border-default"
            />
            <span className="text-sm text-text-secondary">Deposit paid</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Repo URL</label>
            <input
              value={form.repo_url}
              onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
              placeholder="https://github.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Live URL</label>
            <input
              value={form.live_url}
              onChange={(e) => setForm({ ...form, live_url: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Dev Notes</label>
            <textarea
              value={form.dev_notes}
              onChange={(e) => setForm({ ...form, dev_notes: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
              rows={2}
              placeholder="Build notes, requirements, etc."
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
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleMove = async (id: string, newStatus: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus as Project["status"] } : p))
    )
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (err) {
      console.error("Failed to move project:", err)
      fetchProjects() // revert on error
    }
  }

  const handleCreate = async (project: Partial<Project>) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      })
      if (res.ok) {
        fetchProjects()
      }
    } catch (err) {
      console.error("Failed to create project:", err)
    }
  }

  const getColumnProjects = (status: string) =>
    projects.filter((p) => p.status === status)

  const getNextStatus = (current: string): { status: string; label: string } | null => {
    const idx = STATUSES.findIndex((s) => s.key === current)
    if (idx < STATUSES.length - 1) {
      return { status: STATUSES[idx + 1].key, label: STATUSES[idx + 1].label }
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-sm text-text-muted mt-1">Track website builds from spec to live</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUSES.map((s) => {
          const count = getColumnProjects(s.key).length
          return (
            <div
              key={s.key}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface border border-border-default text-xs whitespace-nowrap"
            >
              <span className={s.color}>{count}</span>
              <span className="text-text-muted">{s.label}</span>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">Loading projects...</div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-4">
          {STATUSES.map((col) => {
            const colProjects = getColumnProjects(col.key)
            const next = getNextStatus(col.key)
            return (
              <div key={col.key} className="w-full md:min-w-[260px] md:flex-1">
                <div className="bg-bg-surface border border-border-default rounded-lg">
                  <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">{col.label}</h3>
                    <span className="text-[11px] text-text-muted bg-bg-primary px-2 py-0.5 rounded-full">
                      {colProjects.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[120px]">
                    {colProjects.length === 0 ? (
                      <div className="text-center py-8">
                        <Code size={20} className="text-text-muted mx-auto mb-2 opacity-40" />
                        <p className="text-[11px] text-text-muted">No projects</p>
                      </div>
                    ) : (
                      colProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onMove={handleMove}
                          nextStatus={next?.status}
                          nextLabel={next?.label}
                          onClick={setSelectedProject}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  )
}
