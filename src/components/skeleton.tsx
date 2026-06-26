"use client"

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-bg-primary rounded ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-4 space-y-3">
      <SkeletonRow className="h-4 w-3/4" />
      <SkeletonRow className="h-3 w-1/2" />
      <SkeletonRow className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonRow key={i} className="h-3 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-4">
            {Array.from({ length: cols }).map((_, col) => (
              <SkeletonRow key={col} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-bg-surface border border-border-default rounded-lg p-4 space-y-2">
          <SkeletonRow className="h-3 w-1/2" />
          <SkeletonRow className="h-7 w-2/3" />
        </div>
      ))}
    </div>
  )
}
