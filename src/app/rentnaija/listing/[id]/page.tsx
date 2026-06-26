"use client"

import { use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Shield,
  Building,
  Phone,
  Calendar,
  CheckCircle2,
  Share2,
  Heart,
} from "lucide-react"
import {
  SEED_LISTINGS,
  formatPriceWithPeriod,
  formatPrice,
  getTypeLabel,
} from "@/lib/rentnaija-data"

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const listing = SEED_LISTINGS.find((l) => l.id === id)

  if (!listing) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Building size={40} className="text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm mb-4">Listing not found</p>
          <Link href="/rentnaija/listings" className="text-accent text-sm hover:text-accent-hover">
            ← Back to listings
          </Link>
        </div>
      </div>
    )
  }

  const relatedListings = SEED_LISTINGS.filter(
    (l) => l.id !== listing.id && (l.area === listing.area || l.type === listing.type)
  ).slice(0, 3)

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Breadcrumb */}
      <div className="bg-bg-surface border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link href="/rentnaija" className="hover:text-accent transition-colors">RentNaija</Link>
            <span>/</span>
            <Link href="/rentnaija/listings" className="hover:text-accent transition-colors">Listings</Link>
            <span>/</span>
            <span className="text-text-secondary">{listing.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link
          href="/rentnaija/listings"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to listings
        </Link>

        {/* Image gallery */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden mb-6">
          {listing.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {/* Main image */}
              <div className="md:col-span-2 h-64 md:h-80 relative overflow-hidden">
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              </div>
              {/* Side images */}
              <div className="hidden md:grid grid-rows-2 gap-1">
                {listing.images.slice(1, 3).map((img, i) => (
                  <div key={i} className="relative overflow-hidden">
                    <img src={img} alt={`${listing.title} ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {listing.images.length <= 2 && (
                  <div className="relative overflow-hidden bg-bg-primary flex items-center justify-center">
                    <span className="text-xs text-text-muted">{listing.images.length} photos</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 md:h-80 bg-bg-primary relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Building size={48} className="text-text-muted opacity-20" />
              </div>
            </div>
          )}
            {listing.verified && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/90 text-white text-xs font-semibold">
                <Shield size={12} />
                Verified Listing
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="p-2 rounded-full bg-bg-surface/80 text-text-muted hover:text-accent transition-colors">
                <Heart size={16} />
              </button>
              <button className="p-2 rounded-full bg-bg-surface/80 text-text-muted hover:text-accent transition-colors">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{listing.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                    <MapPin size={14} />
                    {listing.location}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  {getTypeLabel(listing.type)}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
                {listing.bedrooms > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Bed size={14} />
                    {listing.bedrooms} Bedroom{listing.bedrooms !== 1 ? "s" : ""}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Bath size={14} />
                  {listing.bathrooms} Bathroom{listing.bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-2">Description</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {listing.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-xs text-text-secondary"
                  >
                    <CheckCircle2 size={12} className="text-success flex-shrink-0" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Property Details</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Furnishing", value: listing.furnishing === "furnished" ? "Fully Furnished" : listing.furnishing === "semi_furnished" ? "Semi-Furnished" : "Unfurnished" },
                  { label: "Condition", value: listing.condition === "new" ? "Newly Built" : listing.condition === "renovated" ? "Renovated" : "Fairly Used" },
                  { label: "Posted", value: new Date(listing.datePosted).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Property Type", value: getTypeLabel(listing.type) },
                  ...(listing.serviceCharge ? [{ label: "Service Charge", value: formatPrice(listing.serviceCharge) + "/yr" }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="bg-bg-surface border border-border-default rounded-lg p-3">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-medium text-text-primary mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-bg-surface border border-border-default rounded-xl p-5 sticky top-20">
              <p className="text-2xl font-bold text-accent">
                {formatPriceWithPeriod(listing.price, listing.pricePeriod)}
              </p>
              {listing.serviceCharge && (
                <p className="text-xs text-text-muted mt-1">
                  + {formatPrice(listing.serviceCharge)}/yr service charge
                </p>
              )}

              <div className="mt-4 space-y-2">
                <a
                  href={`tel:${listing.phone}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
                >
                  <Phone size={14} />
                  Call Agent
                </a>
                <a
                  href={`https://wa.me/${listing.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-accent text-accent text-sm font-semibold hover:bg-accent/10 transition-colors"
                >
                  WhatsApp
                </a>
              </div>

              <div className="mt-4 pt-4 border-t border-border-default space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Shield size={12} className="text-success" />
                  {listing.agent}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar size={12} />
                  Posted {new Date(listing.datePosted).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related listings */}
        {relatedListings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-text-primary mb-4">Similar Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedListings.map((rl) => (
                <Link
                  key={rl.id}
                  href={`/rentnaija/listing/${rl.id}`}
                  className="bg-bg-surface border border-border-default rounded-xl overflow-hidden hover:border-accent transition-colors group"
                >
                  <div className="h-32 bg-bg-primary relative overflow-hidden">
                    {rl.images[0] ? (
                      <img src={rl.images[0]} alt={rl.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building size={24} className="text-text-muted opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                      {rl.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-text-muted mt-1">
                      <MapPin size={10} /> {rl.area}
                    </div>
                    <p className="text-sm font-bold text-accent mt-2">
                      {formatPriceWithPeriod(rl.price, rl.pricePeriod)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
