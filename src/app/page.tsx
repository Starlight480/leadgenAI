"use client"

import { useState, useEffect, useRef, Fragment, useCallback } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Search,
  PenTool,
  Code2,
  Send,
  Menu,
  X,
  ChevronRight,
  Target,
  UserCheck,
  Globe,
  Mail,
  BarChart3,
  Bell,
  ArrowRight,
  Check,
} from "lucide-react"

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const HERO_WORDS = ["Find.", "Profile.", "Build.", "Deploy."]

const STEPS = [
  {
    icon: Search,
    label: "Scout",
    desc: "Discovers businesses without websites in your target area",
  },
  {
    icon: PenTool,
    label: "Scribe",
    desc: "Profiles each business and creates a custom offer",
  },
  {
    icon: Code2,
    label: "Dev",
    desc: "Generates a professional website in minutes",
  },
  {
    icon: Send,
    label: "Reach",
    desc: "Sends personalised outreach via email or WhatsApp",
  },
]

const FEATURES = [
  {
    icon: Target,
    title: "AI-Powered Scouting",
    desc: "Automatically find businesses that need websites",
  },
  {
    icon: UserCheck,
    title: "Smart Profiling",
    desc: "Generate detailed business profiles with pricing recommendations",
  },
  {
    icon: Globe,
    title: "Instant Website Generation",
    desc: "Create professional landing pages in seconds",
  },
  {
    icon: Mail,
    title: "Multi-Channel Outreach",
    desc: "Email, WhatsApp, AtSign — all from one dashboard",
  },
  {
    icon: BarChart3,
    title: "Pipeline Tracking",
    desc: "Watch your leads move from discovery to deployment",
  },
  {
    icon: Bell,
    title: "Telegram Notifications",
    desc: "Get real-time updates on your pipeline status",
  },
]

const STATS = [
  {
    value: 10,
    prefix: "",
    suffix: "×",
    label: "Faster than manual prospecting",
  },
  {
    value: 3,
    prefix: "",
    suffix: " min",
    label: "Average time from scout to profile",
  },
  {
    value: 0,
    prefix: "₦",
    suffix: " upfront",
    label: "Pay only when you close",
  },
]

const PLANS = [
  {
    name: "Free",
    price: "₦0",
    period: "",
    description:
      "Run Scout campaigns, generate profiles, build sites. You only pay when you deploy.",
    features: [
      "Unlimited scouting",
      "AI profiling",
      "Website generation",
      "Pipeline tracking",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "₦50,000",
    period: "/mo",
    description: "For agencies and teams.",
    features: [
      "Everything in Free",
      "Priority support",
      "Custom branding",
      "API access",
      "White-label deployment",
    ],
    popular: false,
  },
]

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const h = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [])
  return reduced
}

function useCountUp(target: number, duration = 2000, active = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active || target === 0) return
    let start: number | null = null
    let raf: number
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])
  return val
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATION HELPERS
   ═══════════════════════════════════════════════════════════════ */

function fadeUp(delay = 0, reduced = false) {
  return {
    initial: reduced ? (false as const) : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 } as const,
    viewport: { once: true, margin: "-60px" } as const,
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  }
}

/* ═══════════════════════════════════════════════════════════════
   STAT ITEM (needs its own ref for useInView)
   ═══════════════════════════════════════════════════════════════ */

function StatItem({
  stat,
  index,
  reduced,
}: {
  stat: (typeof STATS)[0]
  index: number
  reduced: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const count = useCountUp(stat.value, 2000, isInView)

  const display =
    stat.value === 0
      ? `${stat.prefix}0${stat.suffix}`
      : `${stat.prefix}${count}${stat.suffix}`

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
    >
      <div className="text-4xl md:text-5xl font-bold text-[#f0f0f5] mb-3">
        {display}
      </div>
      <p className="text-sm text-[#8888a0]">{stat.label}</p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const reduced = usePrefersReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const navRef = useRef<HTMLElement>(null)

  const handleNavMouse = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return
    const rect = navRef.current.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false)
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }, [])

  return (
    <div
      className="dark"
      style={{ backgroundColor: "#0c0c10", minHeight: "100vh" }}
    >
      {/* ════════════════════════ NAVBAR ════════════════════════ */}
      <motion.nav
        ref={navRef}
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onMouseMove={handleNavMouse}
        className="fixed top-0 inset-x-0 z-50 border-b border-[#2a2a36]"
        style={{
          backgroundColor: "rgba(10, 10, 15, 0.92)",
          backgroundImage: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(129, 140, 248, 0.04), transparent 40%)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-[#f0f0f5]"
          >
            LeadGen <span className="text-[#818cf8]">OS</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo("features")}
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#818cf8] text-white hover:bg-[#6366f1] transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#8888a0] hover:text-[#f0f0f5] transition-colors cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden overflow-hidden border-t border-[#2a2a36] bg-[#0a0a0f]"
            >
              <div className="px-6 py-4 space-y-1">
                <button
                  onClick={() => scrollTo("features")}
                  className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors cursor-pointer"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollTo("how-it-works")}
                  className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors cursor-pointer"
                >
                  How It Works
                </button>
                <button
                  onClick={() => scrollTo("pricing")}
                  className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors cursor-pointer"
                >
                  Pricing
                </button>
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated gradient orbs */}
        {!reduced && (
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.07]"
              style={{
                background:
                  "radial-gradient(circle, #818cf8, transparent 70%)",
                top: "10%",
                right: "10%",
              }}
              animate={{
                x: [0, 80, -40, 0],
                y: [0, -60, 40, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.05]"
              style={{
                background:
                  "radial-gradient(circle, #3b82f6, transparent 70%)",
                bottom: "20%",
                left: "5%",
              }}
              animate={{
                x: [0, -60, 30, 0],
                y: [0, 50, -30, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.06]"
              style={{
                background:
                  "radial-gradient(circle, #a855f7, transparent 70%)",
                top: "40%",
                left: "40%",
              }}
              animate={{
                x: [0, 40, -60, 0],
                y: [0, -40, 60, 0],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Headline — word-by-word reveal */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6 text-[#f0f0f5]">
            {HERO_WORDS.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={
                  reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
              >
                {word}{" "}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-[#8888a0] max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={
              reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          >
            The AI-powered lead generation pipeline that finds businesses
            without websites, profiles them, and builds landing pages — all
            automatically.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={
              reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          >
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-[#818cf8] text-white font-medium text-sm hover:bg-[#6366f1] transition-colors flex items-center gap-2"
            >
              Start Free <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="px-6 py-3 rounded-lg border border-[#2a2a36] text-[#8888a0] font-medium text-sm hover:text-[#f0f0f5] hover:border-[#3a3a48] transition-colors cursor-pointer"
            >
              See How It Works
            </button>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ HOW IT WORKS ════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            {...fadeUp(0, reduced)}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">
              How It Works
            </h2>
            <p className="text-[#8888a0] max-w-xl mx-auto">
              Four automated stages that turn cold prospects into paying
              clients.
            </p>
          </motion.div>

          {/* Desktop — row with arrow connectors */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-start gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Fragment key={i}>
                  <motion.div
                    {...fadeUp(i * 0.15, reduced)}
                    whileHover={{
                      y: -4,
                      transition: { duration: 0.2 },
                    }}
                  >
                    <div className="bg-[#14141c] border border-[#2a2a36] rounded-xl p-6 h-full transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:border-[#3a3a48]">
                      <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-[#818cf8]" />
                      </div>
                      <div className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-2">
                        Step {i + 1}
                      </div>
                      <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">
                        {step.label}
                      </h3>
                      <p className="text-sm text-[#8888a0] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>

                  {i < STEPS.length - 1 && (
                    <div className="flex items-center pt-12">
                      <motion.div
                        initial={
                          reduced
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.5 }
                        }
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          delay: i * 0.15 + 0.3,
                        }}
                      >
                        <ChevronRight className="w-5 h-5 text-[#555570]" />
                      </motion.div>
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>

          {/* Mobile / Tablet — 2 × 2 grid */}
          <div className="lg:hidden grid grid-cols-2 gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={i}
                  {...fadeUp(i * 0.15, reduced)}
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="bg-[#14141c] border border-[#2a2a36] rounded-xl p-6 h-full transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:border-[#3a3a48]">
                    <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#818cf8]" />
                    </div>
                    <div className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-2">
                      Step {i + 1}
                    </div>
                    <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">
                      {step.label}
                    </h3>
                    <p className="text-sm text-[#8888a0] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════ FEATURES ════════════════════════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            {...fadeUp(0, reduced)}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">
              Everything You Need
            </h2>
            <p className="text-[#8888a0] max-w-xl mx-auto">
              A complete toolkit for automated lead generation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={i}
                  {...fadeUp(i * 0.1, reduced)}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="bg-[#14141c] border border-[#2a2a36] rounded-xl p-6 h-full transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:border-[#3a3a48]">
                    <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#818cf8]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-[#8888a0] leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════ STATS ════════════════════════ */}
      <section className="py-24 px-6 bg-[#14141c]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STATS.map((stat, i) => (
              <StatItem
                key={i}
                stat={stat}
                index={i}
                reduced={reduced}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ PRICING ════════════════════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            {...fadeUp(0, reduced)}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">
              Simple Pricing
            </h2>
            <p className="text-[#8888a0] max-w-xl mx-auto">
              Start free. Pay when you close deals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.15, reduced)}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2 },
                }}
                className="relative"
              >
                <div
                  className={`bg-[#14141c] border rounded-xl p-8 h-full transition-all duration-200 hover:shadow-lg hover:shadow-black/20 ${
                    plan.popular
                      ? "border-[#818cf8]"
                      : "border-[#2a2a36] hover:border-[#3a3a48]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-[#818cf8] text-white text-xs font-medium">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-[#f0f0f5] mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-[#f0f0f5]">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-[#8888a0]">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8888a0] mb-6 leading-relaxed">
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-sm text-[#8888a0]"
                      >
                        <Check className="w-4 h-4 text-[#818cf8] mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`block w-full text-center py-3 rounded-lg text-sm font-medium transition-colors ${
                      plan.popular
                        ? "bg-[#818cf8] text-white hover:bg-[#6366f1]"
                        : "border border-[#2a2a36] text-[#8888a0] hover:text-[#f0f0f5] hover:border-[#3a3a48]"
                    }`}
                  >
                    {plan.popular ? "Get Started" : "Contact Us"}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ CTA ════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Subtle animated gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c10] via-[#14141c] to-[#0c0c10]" />
          {!reduced && (
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.08] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "radial-gradient(circle, #818cf8, transparent 70%)",
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>

        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center"
          {...fadeUp(0, reduced)}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-6">
            Ready to find your next client?
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[#818cf8] text-white font-medium hover:bg-[#6366f1] transition-colors text-base"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer className="border-t border-[#2a2a36] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-[#f0f0f5]"
            >
              LeadGen <span className="text-[#818cf8]">OS</span>
            </Link>
            <p className="text-xs text-[#555570] mt-2">
              © 2026 LeadGen OS. Built for Nigerian businesses.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollTo("features")}
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <Link
              href="/login"
              className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
