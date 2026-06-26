"use client"

import { Sidebar } from "@/components/sidebar"

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-60 p-4 md:p-6 pt-14 md:pt-6">
        {children}
      </main>
    </div>
  )
}
