"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    fetch("/api/auth/check").then(r => {
      if (r.ok) router.replace("/dashboard")
      else router.replace("/login")
    }).catch(() => router.replace("/login"))
  }, [router])
  return <div className="min-h-screen bg-bg-primary" />
}
