"use client"

import Link from "next/link"
import { MapPin, Building, ArrowRight } from "lucide-react"
import { SEED_LISTINGS, AREA_NEIGHBORHOODS, formatPriceWithPeriod } from "@/lib/rentnaija-data"

export default function AreasPage() {
  const areas = Object.entries(AREA_NEIGHBORHOODS)

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="bg-bg-surface border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-text-primary">Browse by Area</h1>
          <p className="text-sm text-text-muted mt-1">Explore rental listings across Lagos neighborhoods</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map(([area, neighborhoods]) => {
            const areaListings = SEED_LISTINGS.filter(
              (l) => l.area === area || l.location.includes(area)
            )
            const priceRange = areaListings.length > 0
              ? {
                  min: Math.min(...areaListings.map((l) => l.price)),
                  max: Math.max(...areaListings.map((l) => l.price)),
                }
              : null

            return (
              <div
                key={area}
                className="bg-bg-surface border border-border-default rounded-xl p-5 hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <MapPin size={16} className="text-accent" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-primary">{area}</h2>
                      <p className="text-xs text-text-muted">
                        {areaListings.length} listing{areaListings.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/rentnaija/listings?area=${encodeURIComponent(area)}`}
                    className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {priceRange && (
                  <p className="text-xs text-text-secondary mb-3">
                    From {formatPriceWithPeriod(priceRange.min, "yearly")}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {neighborhoods.map((n) => (
                    <Link
                      key={n}
                      href={`/rentnaija/listings?area=${encodeURIComponent(n)}`}
                      className="px-2.5 py-1 rounded-full bg-bg-primary border border-border-default text-[11px] text-text-muted hover:text-accent hover:border-accent transition-colors"
                    >
                      {n}
                    </Link>
                  ))}
                </div>

                {/* Featured listing preview */}
                {areaListings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-default">
                    <div className="flex items-center gap-2">
                      <Building size={12} className="text-text-muted" />
                      <p className="text-[11px] text-text-muted truncate">
                        {areaListings[0].title}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-accent mt-0.5">
                      {formatPriceWithPeriod(areaListings[0].price, areaListings[0].pricePeriod)}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
