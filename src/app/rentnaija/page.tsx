"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  MapPin,
  Bed,
  Bath,
  ArrowRight,
  Shield,
  Star,
  TrendingUp,
  Building,
} from "lucide-react"
import {
  SEED_LISTINGS,
  AREA_NEIGHBORHOODS,
  formatPriceWithPeriod,
  getTypeLabel,
} from "@/lib/rentnaija-data"

const STATS = [
  { label: "Listings", value: "11,700+", icon: Building },
  { label: "Areas", value: "50+", icon: MapPin },
  { label: "Verified", value: "100%", icon: Shield },
  { label: "Avg Response", value: "24hrs", icon: TrendingUp },
]

export default function RentNaijaHome() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArea, setSelectedArea] = useState("")

  const featuredListings = useMemo(
    () => SEED_LISTINGS.filter((l) => l.featured).slice(0, 6),
    []
  )

  const areas = Object.keys(AREA_NEIGHBORHOODS)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedArea) params.set("area", selectedArea)
    window.location.href = `/rentnaija/listings?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero */}
      <section className="relative bg-bg-surface border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6">
              <Shield size={12} />
              Verified Listings Across Lagos
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight mb-4">
              Find Your Perfect
              <span className="text-accent"> Home</span> in Lagos
            </h1>
            <p className="text-lg text-text-muted mb-8">
              Browse thousands of verified rental listings across every neighborhood in Lagos. From affordable mainland apartments to luxury island duplexes.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by location, estate, or keyword..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                />
              </div>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="px-4 py-3 rounded-lg bg-bg-primary border border-border-default text-text-secondary text-sm focus:outline-none focus:border-accent"
              >
                <option value="">All Areas</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex items-center gap-3 px-4 py-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Featured Listings</h2>
            <p className="text-sm text-text-muted mt-1">Handpicked properties across prime Lagos locations</p>
          </div>
          <Link
            href="/rentnaija/listings"
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/rentnaija/listing/${listing.id}`}
              className="bg-bg-surface border border-border-default rounded-xl overflow-hidden hover:border-accent transition-colors group"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-bg-primary relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building size={32} className="text-text-muted opacity-30" />
                </div>
                {listing.verified && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/90 text-white text-[10px] font-semibold">
                    <Shield size={10} />
                    Verified
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent/90 text-white text-[10px] font-semibold">
                  {getTypeLabel(listing.type)}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                  {listing.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                  <MapPin size={12} />
                  {listing.location}
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary">
                  {listing.bedrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Bed size={12} />
                      {listing.bedrooms} Bed{listing.bedrooms !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Bath size={12} />
                    {listing.bathrooms} Bath{listing.bathrooms !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-default">
                  <p className="text-base font-bold text-accent">
                    {formatPriceWithPeriod(listing.price, listing.pricePeriod)}
                  </p>
                  {listing.furnishing === "furnished" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                      Furnished
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Area */}
      <section className="border-t border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Browse by Area</h2>
          <p className="text-sm text-text-muted mb-6">Explore listings across Lagos neighborhoods</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {areas.map((area) => {
              const count = SEED_LISTINGS.filter((l) => l.area === area || l.location.includes(area)).length
              return (
                <Link
                  key={area}
                  href={`/rentnaija/listings?area=${encodeURIComponent(area)}`}
                  className="bg-bg-surface border border-border-default rounded-lg p-4 hover:border-accent transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-accent" />
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{area}</h3>
                  </div>
                  <p className="text-xs text-text-muted">
                    {count > 0 ? `${count} listing${count !== 1 ? "s" : ""}` : "Browse all"}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">List Your Property</h2>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Own a property in Lagos? List it on RentNaija and reach thousands of potential tenants.
          </p>
          <Link
            href="/rentnaija/listings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            <Star size={14} />
            Get Started
          </Link>
        </div>
      </section>
    </div>
  )
}
