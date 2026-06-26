"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Search,
  MapPin,
  Bed,
  Bath,
  SlidersHorizontal,
  Grid3X3,
  List,
  Building,
  Shield,
  X,
} from "lucide-react"
import {
  SEED_LISTINGS,
  AREA_NEIGHBORHOODS,
  formatPriceWithPeriod,
  getTypeLabel,
} from "@/lib/rentnaija-data"
import type { Listing } from "@/lib/rentnaija-data"

const PROPERTY_TYPES = [
  "apartment", "duplex", "mini_flat", "bungalow", "studio",
  "shortlet", "room_parlour", "block_of_flats",
]

const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under ₦1M", min: 0, max: 1000000 },
  { label: "₦1M – ₦3M", min: 1000000, max: 3000000 },
  { label: "₦3M – ₦5M", min: 3000000, max: 5000000 },
  { label: "₦5M – ₦10M", min: 5000000, max: 10000000 },
  { label: "₦10M+", min: 10000000, max: Infinity },
]

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"]

function ListingCard({ listing, view }: { listing: Listing; view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <Link
        href={`/rentnaija/listing/${listing.id}`}
        className="flex bg-bg-surface border border-border-default rounded-xl overflow-hidden hover:border-accent transition-colors group"
      >
        <div className="w-48 h-36 bg-bg-primary relative flex-shrink-0 overflow-hidden">
          {listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building size={24} className="text-text-muted opacity-30" />
            </div>
          )}
          {listing.verified && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/90 text-white text-[10px] font-semibold">
              <Shield size={10} /> Verified
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                {listing.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                <MapPin size={11} />
                {listing.location}
              </div>
            </div>
            <p className="text-base font-bold text-accent whitespace-nowrap">
              {formatPriceWithPeriod(listing.price, listing.pricePeriod)}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            {listing.bedrooms > 0 && (
              <span className="flex items-center gap-1"><Bed size={11} /> {listing.bedrooms} Bed</span>
            )}
            <span className="flex items-center gap-1"><Bath size={11} /> {listing.bathrooms} Bath</span>
            <span>{getTypeLabel(listing.type)}</span>
            {listing.furnishing === "furnished" && (
              <span className="text-warning">Furnished</span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-2 line-clamp-1">{listing.description}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/rentnaija/listing/${listing.id}`}
      className="bg-bg-surface border border-border-default rounded-xl overflow-hidden hover:border-accent transition-colors group"
    >
      <div className="h-44 bg-bg-primary relative overflow-hidden">
        {listing.images[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building size={28} className="text-text-muted opacity-30" />
          </div>
        )}
        {listing.verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/90 text-white text-[10px] font-semibold">
            <Shield size={10} /> Verified
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
        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
          <MapPin size={11} /> {listing.location}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
          {listing.bedrooms > 0 && (
            <span className="flex items-center gap-1"><Bed size={11} /> {listing.bedrooms} Bed</span>
          )}
          <span className="flex items-center gap-1"><Bath size={11} /> {listing.bathrooms} Bath</span>
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
  )
}

export default function ListingsPage() {
  const searchParams = useSearchParams()
  const initialArea = searchParams.get("area") || ""
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedArea, setSelectedArea] = useState(initialArea)
  const [selectedType, setSelectedType] = useState("")
  const [selectedPriceRange, setSelectedPriceRange] = useState(0)
  const [selectedBedrooms, setSelectedBedrooms] = useState("Any")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const areas = Object.keys(AREA_NEIGHBORHOODS)

  const filteredListings = useMemo(() => {
    return SEED_LISTINGS.filter((listing) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match =
          listing.title.toLowerCase().includes(q) ||
          listing.location.toLowerCase().includes(q) ||
          listing.area.toLowerCase().includes(q) ||
          listing.description.toLowerCase().includes(q)
        if (!match) return false
      }
      if (selectedArea) {
        if (listing.area !== selectedArea && !listing.location.includes(selectedArea)) return false
      }
      if (selectedType && listing.type !== selectedType) return false
      const priceRange = PRICE_RANGES[selectedPriceRange]
      if (priceRange.min > 0 || priceRange.max < Infinity) {
        if (listing.price < priceRange.min || listing.price > priceRange.max) return false
      }
      if (selectedBedrooms !== "Any") {
        if (selectedBedrooms === "5+") {
          if (listing.bedrooms < 5) return false
        } else {
          if (listing.bedrooms !== Number(selectedBedrooms)) return false
        }
      }
      return true
    })
  }, [searchQuery, selectedArea, selectedType, selectedPriceRange, selectedBedrooms])

  const activeFilterCount = [
    selectedArea,
    selectedType,
    selectedPriceRange !== 0 ? "price" : "",
    selectedBedrooms !== "Any" ? "beds" : "",
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedArea("")
    setSelectedType("")
    setSelectedPriceRange(0)
    setSelectedBedrooms("Any")
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-bg-surface border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Rental Listings</h1>
              <p className="text-sm text-text-muted mt-0.5">
                {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-accent text-white" : "bg-bg-primary text-text-muted hover:text-text-secondary"}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-accent text-white" : "bg-bg-primary text-text-muted hover:text-text-secondary"}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locations, estates, keywords..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-primary border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-default text-text-secondary hover:border-border-hover"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-bg-primary border border-border-default rounded-lg space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted mb-2 block">Area</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedArea("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !selectedArea ? "bg-accent text-white" : "bg-bg-surface border border-border-default text-text-muted"
                    }`}
                  >
                    All Areas
                  </button>
                  {areas.map((a) => (
                    <button
                      key={a}
                      onClick={() => setSelectedArea(a)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedArea === a ? "bg-accent text-white" : "bg-bg-surface border border-border-default text-text-muted"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted mb-2 block">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !selectedType ? "bg-accent text-white" : "bg-bg-surface border border-border-default text-text-muted"
                    }`}
                  >
                    All Types
                  </button>
                  {PROPERTY_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedType === t ? "bg-accent text-white" : "bg-bg-surface border border-border-default text-text-muted"
                      }`}
                    >
                      {getTypeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted mb-2 block">Price Range</label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((pr, i) => (
                    <button
                      key={pr.label}
                      onClick={() => setSelectedPriceRange(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedPriceRange === i ? "bg-accent text-white" : "bg-bg-surface border border-border-default text-text-muted"
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted mb-2 block">Bedrooms</label>
                <div className="flex gap-2">
                  {BEDROOM_OPTIONS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBedrooms(b)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedBedrooms === b ? "bg-accent text-white" : "bg-bg-surface border border-border-default text-text-muted"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-error hover:text-error/80 transition-colors"
                >
                  <X size={12} /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <Building size={40} className="text-text-muted mx-auto mb-3 opacity-30" />
            <p className="text-sm text-text-muted">No listings match your filters.</p>
            <button onClick={clearFilters} className="text-sm text-accent hover:text-accent-hover mt-2">
              Clear filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} view="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} view="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
