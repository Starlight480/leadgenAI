"use client"

import { useState, useRef, useCallback } from "react"
import {
  motion,
  AnimatePresence,
} from "framer-motion"
import Link from "next/link"
import {
  Menu,
  X,
  ArrowRight,
  Zap,
  Check,
} from "lucide-react"
import {
  AnimatedPipeline,
  DashboardMock,
  DataGrid,
  CtaBackground,
} from "@/components/landing-visuals"

const HERO_WORDS = ["Find.", "Profile.", "Build.", "Deploy."]

function usePrefersReducedMotion() {
  const [reduced] = useState(false)
  return reduced
}

export default function LandingHero() {
  const reduced = usePrefersReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const navRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const handleNavMouse = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return
    const rect = navRef.current.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  return (
    <div
      className="dark"
      style={{ backgroundColor: "#0a0a0e", minHeight: "100vh" }}
    >
      {/* ════════════════════════ NAVBAR ════════════════════════ */}
      <motion.nav
        ref={navRef}
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onMouseMove={handleNavMouse}
        className="fixed top-0 inset-x-0 z-50 border-b border-[#1e1e2a]"
        style={{
          backgroundColor: "rgba(10, 10, 14, 0.92)",
          backgroundImage: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(129, 140, 248, 0.03), transparent 40%)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-[#f0f0f5]"
          >
            LeadGen <span className="text-[#818cf8]">OS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/features"
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#818cf8] text-white hover:bg-[#6366f1] transition-colors"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden text-[#8888a0] hover:text-[#f0f0f5] transition-colors cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden overflow-hidden border-t border-[#1e1e2a] bg-[#0a0a0e]"
            >
              <div className="px-6 py-4 space-y-1">
                <Link
                  href="/features"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium px-4 py-3 rounded-lg bg-[#818cf8] text-white text-center mt-3 hover:bg-[#6366f1] transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-16"
      >
        <DataGrid />
        <AnimatedPipeline />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #0a0a0e 100%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#818cf8]/20 bg-[#818cf8]/5 text-[#818cf8] text-xs font-medium">
                <Zap size={12} />
                Built for Nigerian businesses
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-[#f0f0f5]">
              {HERO_WORDS.map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.7,
                    delay: 0.2 + i * 0.12,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {word}{" "}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="text-lg md:text-xl text-[#8888a0] max-w-xl mb-10 leading-relaxed"
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            >
              The pipeline that finds businesses without websites, profiles
              them, and builds landing pages — all automatically. No cold
              calls. No spreadsheets.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4"
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
            >
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-lg bg-[#818cf8] text-white font-medium text-sm hover:bg-[#6366f1] transition-all flex items-center gap-2 hover:gap-3"
              >
                Start Free <ArrowRight size={16} />
              </Link>
              <Link
                href="/features"
                className="px-6 py-3.5 rounded-lg border border-[#2a2a36] text-[#8888a0] font-medium text-sm hover:text-[#f0f0f5] hover:border-[#3a3a48] transition-colors"
              >
                See How It Works
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="relative hidden lg:block"
            initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            <motion.div className="relative">
              <DashboardMock className="w-full" />
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 bg-[#14141c] border border-[#2a2a36] rounded-lg px-4 py-3 shadow-xl"
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#f0f0f5]">12 leads found</p>
                  <p className="text-[10px] text-[#555570]">Scout running in Ikeja…</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ CTA ════════════════════════ */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="relative h-80 md:h-[420px] bg-[#0a0a0e]">
              <CtaBackground />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-[#0a0a0e]/60 to-[#0a0a0e]/30" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <motion.div
                initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f0f0f5] mb-4 leading-tight">
                  Ready to find your next client?
                </h2>
                <p className="text-[#8888a0] text-lg mb-8 max-w-lg mx-auto">
                  Start finding, profiling, and closing businesses today.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[#818cf8] text-white font-medium hover:bg-[#6366f1] transition-all text-base hover:gap-3"
                >
                  Get Started Free <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer className="border-t border-[#1e1e2a] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight text-[#f0f0f5]">
              LeadGen <span className="text-[#818cf8]">OS</span>
            </Link>
            <p className="text-xs text-[#555570] mt-2">
              © 2026 LeadGen OS. Built for Nigerian businesses.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}