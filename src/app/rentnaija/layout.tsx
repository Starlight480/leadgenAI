"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, MapPin, Building } from "lucide-react"

const NAV_ITEMS = [
  { href: "/rentnaija", label: "Home", icon: Home },
  { href: "/rentnaija/listings", label: "Listings", icon: Search },
  { href: "/rentnaija/areas", label: "Areas", icon: MapPin },
]

export default function RentNaijaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* RentNaija sub-nav */}
      <div className="bg-bg-surface border-b border-border-default sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <div className="flex items-center gap-1.5 mr-4 pr-4 border-r border-border-default">
              <Building size={16} className="text-accent" />
              <span className="text-sm font-bold text-text-primary whitespace-nowrap">RentNaija</span>
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/rentnaija" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-text-muted hover:text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  <Icon size={12} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
