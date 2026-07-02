"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type Theme = "dark" | "light"

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "light", toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("leadgen-theme") as Theme | null
    if (saved) {
      setTheme(saved)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    }
    // No saved preference and no dark preference → stays "light" (default)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("leadgen-theme", theme)
  }, [theme, mounted])

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"))

  if (!mounted) {
    return <html lang="en"><body>{children}</body></html>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
