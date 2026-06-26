import { Suspense } from "react"

function ListingsLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-bg-surface border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-text-primary">Rental Listings</h1>
          <p className="text-sm text-text-muted mt-0.5">Loading...</p>
        </div>
      </div>
    </div>
  )
}

const ListingsContent = async () => {
  const mod = await import("./listings-content")
  const ListingsPage = mod.default
  return <ListingsPage />
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsLoading />}>
      <ListingsContent />
    </Suspense>
  )
}
