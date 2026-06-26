"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  error: Error
  reset?: () => void
}

export function ErrorFallback({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-error/10 mb-4">
        <AlertTriangle size={24} className="text-error" />
      </div>
      <h2 className="text-lg font-bold text-text-primary mb-1">Something went wrong</h2>
      <p className="text-sm text-text-muted text-center max-w-md mb-4">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {reset && (
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}: {
  icon: React.ElementType
  title: string
  description: string
  action?: () => void
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-bg-primary mb-4">
        <Icon size={28} className="text-text-muted opacity-40" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-muted text-center max-w-sm mb-4">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
