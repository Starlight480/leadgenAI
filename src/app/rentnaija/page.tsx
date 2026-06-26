"use client"

import { Building } from "lucide-react"

export default function RentNaijaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">RentNaija</h1>
        <p className="text-sm text-text-muted mt-1">Property listings pushed to RentNaija</p>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-primary text-text-muted text-[11px] font-semibold uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left">Property</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-left">Bedrooms</th>
              <th className="px-4 py-2.5 text-left">Location</th>
              <th className="px-4 py-2.5 text-left">Price/yr</th>
              <th className="px-4 py-2.5 text-left">Pushed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">
                <Building size={32} className="mx-auto mb-3" />
                No rental listings yet. Scout will find property leads automatically.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
