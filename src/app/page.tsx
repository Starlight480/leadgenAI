"use client"

import { useState, useEffect, useRef, Fragment, useCallback } from "react"
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion"
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
  Zap,
  Shield,
  Users,
  Quote,
} from "lucide-react"
import {
  AnimatedPipeline,
  DashboardMock,
  StepIllustration,
  DataGrid,
  PipelineFlow,
  CtaBackground,
  FeatureScoutIllustration,
  FeaturePipelineIllustration,
} from "@/components/landing-visuals"

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */



const HERO_WORDS = ["Find.", "Profile.", "Build.", "Deploy."]

const STEPS = [
  {
    icon: Search,
    label: "Scout",
    desc: "Discovers businesses without websites in your target area",
    step: "scout" as const,
  },
  {
    icon: PenTool,
    label: "Scribe",
    desc: "Profiles each business and creates a custom offer",
    step: "scribe" as const,
  },
  {
    icon: Code2,
    label: "Dev",
    desc: "Generates a professional website in minutes",
    step: "dev" as const,
  },
  {
    icon: Send,
    label: "Reach",
    desc: "Sends personalised outreach via email or WhatsApp",
    step: "reach" as const,
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
    desc: "Email, WhatsApp, Telegram — all from one dashboard",
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
    name: "Starter",
    monthlyPrice: "₦0",
    yearlyPrice: "₦0",
    yearlyBilled: "",
    period: "/mo",
    description: "Free forever. Perfect for getting started.",
    features: [
      "5 Scout campaigns/month",
      "Basic profiling",
      "Pipeline tracking",
      "Email support",
    ],
    popular: false,
    cta: "Start Free",
  },
  {
    name: "Growth",
    monthlyPrice: "₦50,000",
    yearlyPrice: "₦40,000",
    yearlyBilled: "billed annually at ₦480,000",
    period: "/mo",
    description: "For serious lead generators ready to scale.",
    features: [
      "Unlimited Scout campaigns",
      "Advanced AI profiling",
      "Website generation",
      "Multi-channel outreach",
      "Telegram notifications",
      "Priority support",
    ],
    popular: true,
    cta: "Get Started",
  },
  {
    name: "Agency",
    monthlyPrice: "₦150,000",
    yearlyPrice: "₦120,000",
    yearlyBilled: "billed annually at ₦1,440,000",
    period: "/mo",
    description: "For teams and agencies that need full control.",
    features: [
      "Everything in Growth",
      "Custom branding",
      "API access",
      "White-label deployment",
      "Dedicated account manager",
      "Custom integrations",
    ],
    popular: false,
    cta: "Contact Sales",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "We went from cold-calling 50 businesses a day to having 200 qualified leads in our pipeline within a week. LeadGen OS changed everything.",
    author: "Chidi Okafor",
    role: "Founder, WebCraft Lagos",
  },
  {
    quote:
      "The scouting is frighteningly good. It found a whole cluster of businesses we'd never have discovered manually.",
    author: "Amina Bello",
    role: "Growth Lead, DigitalBridge NG",
  },
  {
    quote:
      "Three minutes from finding a business to having a ready-to-send proposal. That's not hyperbole — we timed it.",
    author: "Tunde Adebayo",
    role: "CEO, SiteForge Studios",
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
    initial: reduced ? (false as const) : { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 } as const,
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }
}

/* ═══════════════════════════════════════════════════════════════
   STAT ITEM
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
   IMAGE REVEAL SECTION
   ═══════════════════════════════════════════════════════════════ */

function ImageRevealSection({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const clipPath = useTransform(
    scrollYProgress,
    [0.1, 0.5],
    ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]
  )

  const opacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])

  return (
    <section ref={ref} className="py-0 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden">
          <motion.div
            style={reduced ? {} : { clipPath, opacity }}
            className="relative aspect-[16/9] md:aspect-[21/9]"
          >
            {/* Animated pipeline visualization instead of stock photo */}
            <div className="absolute inset-0 bg-[#0a0a0e]">
              <PipelineFlow className="w-full h-full" />
            </div>
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c10] via-[#0c0c10]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] via-transparent to-[#0c0c10]/40" />
          </motion.div>

          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-8 md:px-16">
              <motion.div {...fadeUp(0.2, reduced)}>
                <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-4">
                  Live Dashboard
                </p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f0f0f5] mb-4 leading-tight">
                  See every lead.
                  <br />
                  <span className="text-[#818cf8]">At a glance.</span>
                </h2>
                <p className="text-[#8888a0] text-lg leading-relaxed">
                  Real-time pipeline visibility. From first scout to final
                  deployment — nothing slips through.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PRICING TOGGLE
   ═══════════════════════════════════════════════════════════════ */

function PricingToggle({
  isYearly,
  onToggle,
  reduced,
}: {
  isYearly: boolean
  onToggle: (v: boolean) => void
  reduced: boolean
}) {
  return (
    <motion.div
      className="flex items-center justify-center gap-3 mb-12"
      {...fadeUp(0.1, reduced)}
    >
      <span
        className={`text-sm font-medium transition-colors cursor-pointer ${
          !isYearly ? "text-[#f0f0f5]" : "text-[#555570]"
        }`}
        onClick={() => onToggle(false)}
      >
        Monthly
      </span>

      <button
        onClick={() => onToggle(!isYearly)}
        className="relative w-12 h-6 rounded-full bg-[#2a2a36] transition-colors duration-300 cursor-pointer"
        aria-label="Toggle billing period"
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-[#818cf8]"
          animate={{ left: isYearly ? "26px" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>

      <span
        className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
          isYearly ? "text-[#f0f0f5]" : "text-[#555570]"
        }`}
        onClick={() => onToggle(true)}
      >
        Yearly
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#818cf8]/15 text-[#818cf8] text-[10px] font-semibold uppercase tracking-wider">
          Save 20%
        </span>
      </span>
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
  const [isYearly, setIsYearly] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  /* Parallax for hero image */
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroImageY = useTransform(heroScroll, [0, 1], [0, -120])

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
              className="md:hidden overflow-hidden border-t border-[#1e1e2a] bg-[#0a0a0e]"
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
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-16"
      >
        {/* Animated data grid background */}
        <DataGrid />
        {/* Animated pipeline visualization */}
        <AnimatedPipeline />
        {/* Radial fade so grid doesn't show at edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #0a0a0e 100%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            {/* Tagline */}
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

            {/* Headline — word-by-word stagger */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-[#f0f0f5]">
              {HERO_WORDS.map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={
                    reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30, filter: "blur(4px)" }
                  }
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

            {/* Subheadline */}
            <motion.p
              className="text-lg md:text-xl text-[#8888a0] max-w-xl mb-10 leading-relaxed"
              initial={
                reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            >
              The pipeline that finds businesses without websites, profiles
              them, and builds landing pages — all automatically. No cold
              calls. No spreadsheets.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4"
              initial={
                reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
            >
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-lg bg-[#818cf8] text-white font-medium text-sm hover:bg-[#6366f1] transition-all flex items-center gap-2 hover:gap-3"
              >
                Start Free <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="px-6 py-3.5 rounded-lg border border-[#2a2a36] text-[#8888a0] font-medium text-sm hover:text-[#f0f0f5] hover:border-[#3a3a48] transition-colors cursor-pointer"
              >
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Right: Dashboard mock + animated pipeline */}
          <motion.div
            className="relative hidden lg:block"
            initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="relative"
              style={reduced ? {} : { y: heroImageY }}
            >
              <DashboardMock className="w-full" />
            </motion.div>

            {/* Floating badge */}
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
                  <p className="text-xs font-semibold text-[#f0f0f5]">
                    12 leads found
                  </p>
                  <p className="text-[10px] text-[#555570]">
                    Scout running in Ikeja…
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ HOW IT WORKS ════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="mb-16" {...fadeUp(0, reduced)}>
            <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">
              The Pipeline
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">
              Four steps. Fully automated.
            </h2>
            <p className="text-[#8888a0] max-w-xl">
              From discovery to deployment, every stage runs on autopilot.
              You review. The AI does the work.
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
                      y: -6,
                      transition: { duration: 0.25 },
                    }}
                  >
                    <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                      {/* Step image */}
                      <div className="relative h-32 overflow-hidden bg-[#0a0a0e]">
                        <StepIllustration step={step.step} className="w-full h-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent" />
                        <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#818cf8] flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-1.5">
                          Step {i + 1}
                        </div>
                        <h3 className="text-base font-semibold text-[#f0f0f5] mb-1.5">
                          {step.label}
                        </h3>
                        <p className="text-sm text-[#8888a0] leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {i < STEPS.length - 1 && (
                    <div className="flex items-center pt-16">
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
                  <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30">
                    <div className="relative h-24 overflow-hidden bg-[#0a0a0e]">
                      <StepIllustration step={step.step} className="w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent" />
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#818cf8] flex items-center justify-center">
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-1">
                        Step {i + 1}
                      </div>
                      <h3 className="text-sm font-semibold text-[#f0f0f5] mb-1">
                        {step.label}
                      </h3>
                      <p className="text-xs text-[#8888a0] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════ FEATURES — ASYMMETRIC ════════════════════════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="mb-16" {...fadeUp(0, reduced)}>
            <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">
              Your pipeline, fully automated
            </h2>
            <p className="text-[#8888a0] max-w-xl">
              Everything you need to find, profile, and convert businesses —
              without lifting a finger.
            </p>
          </motion.div>

          {/* Asymmetric feature rows */}
          <div className="space-y-6">
            {/* Row 1: Large image card + two smaller cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large image card — AI-Powered Scouting */}
              <motion.div
                {...fadeUp(0, reduced)}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="lg:col-span-2 relative group"
              >
                <div className="relative bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30">
                  <div className="relative h-48 md:h-56 overflow-hidden bg-[#0a0a0e]">
                    <FeatureScoutIllustration className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/40 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-[#818cf8]" />
                        <span className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest">
                          AI-Powered Scouting
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#f0f0f5] mb-1">
                        Find businesses that need you
                      </h3>
                      <p className="text-sm text-[#8888a0]">
                        Automatically discovers businesses without websites in
                        your target area — updated in real time.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Small card — Smart Profiling */}
              <motion.div
                {...fadeUp(0.1, reduced)}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                  <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                    <UserCheck className="w-5 h-5 text-[#818cf8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">
                    Smart Profiling
                  </h3>
                  <p className="text-sm text-[#8888a0] leading-relaxed">
                    Generate detailed business profiles with pricing
                    recommendations — before you even make contact.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Row 2: Two medium cards + one large image card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Small card — Website Generation */}
              <motion.div
                {...fadeUp(0, reduced)}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                  <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                    <Globe className="w-5 h-5 text-[#818cf8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">
                    Instant Website Generation
                  </h3>
                  <p className="text-sm text-[#8888a0] leading-relaxed">
                    Professional landing pages created in seconds, ready to
                    deploy with one click.
                  </p>
                </div>
              </motion.div>

              {/* Small card — Multi-Channel Outreach */}
              <motion.div
                {...fadeUp(0.1, reduced)}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                  <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                    <Mail className="w-5 h-5 text-[#818cf8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">
                    Multi-Channel Outreach
                  </h3>
                  <p className="text-sm text-[#8888a0] leading-relaxed">
                    Email, WhatsApp, Telegram — reach them wherever they are,
                    all from one dashboard.
                  </p>
                </div>
              </motion.div>

              {/* Large image card — Pipeline Tracking */}
              <motion.div
                {...fadeUp(0.2, reduced)}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="relative group"
              >
                <div className="relative bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30">
                  <div className="relative h-48 md:h-auto md:min-h-[240px] overflow-hidden bg-[#0a0a0e]">
                    <FeaturePipelineIllustration className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/50 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-[#818cf8]" />
                        <span className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest">
                          Pipeline Tracking
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#f0f0f5]">
                        Watch leads convert
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ IMAGE REVEAL ════════════════════════ */}
      <ImageRevealSection reduced={reduced} />

      {/* ════════════════════════ STATS ════════════════════════ */}
      <section className="py-24 px-6">
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

      {/* ════════════════════════ TESTIMONIALS ════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="mb-16" {...fadeUp(0, reduced)}>
            <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">
              What people say
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5]">
              Trusted by builders across Nigeria
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.12, reduced)}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full flex flex-col transition-all duration-300 hover:border-[#818cf8]/30">
                  <Quote className="w-8 h-8 text-[#818cf8]/20 mb-4" />
                  <p className="text-sm text-[#8888a0] leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-[#1e1e2a] pt-4">
                    <p className="text-sm font-semibold text-[#f0f0f5]">
                      {t.author}
                    </p>
                    <p className="text-xs text-[#555570]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ PRICING ════════════════════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-8"
            {...fadeUp(0, reduced)}
          >
            <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">
              Simple. Transparent. No surprises.
            </h2>
            <p className="text-[#8888a0] max-w-xl mx-auto">
              Start free, scale when you&apos;re ready. Pay monthly or save 20%
              with annual billing.
            </p>
          </motion.div>

          {/* Toggle */}
          <PricingToggle
            isYearly={isYearly}
            onToggle={setIsYearly}
            reduced={reduced}
          />

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...fadeUp(i * 0.1, reduced)}
                whileHover={{
                  y: -6,
                  transition: { duration: 0.25 },
                }}
                className={`relative ${plan.popular ? "md:-mt-4 md:mb-[-16px]" : ""}`}
              >
                <div
                  className={`bg-[#111118] border rounded-xl p-8 h-full transition-all duration-300 ${
                    plan.popular
                      ? "border-[#818cf8] shadow-lg shadow-[#818cf8]/10"
                      : "border-[#1e1e2a] hover:border-[#2a2a36]"
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

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isYearly ? "yearly" : "monthly"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="mb-2"
                    >
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#f0f0f5]">
                          {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        {plan.period && (
                          <span className="text-sm text-[#8888a0]">
                            {plan.period}
                          </span>
                        )}
                      </div>
                      {isYearly && plan.yearlyBilled && (
                        <p className="text-xs text-[#555570] mt-1">
                          {plan.yearlyBilled}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>

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
                    {plan.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ LARGE IMAGE CTA ════════════════════════ */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="relative h-80 md:h-[420px] bg-[#0a0a0e]">
              <CtaBackground />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-[#0a0a0e]/60 to-[#0a0a0e]/30" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <motion.div {...fadeUp(0, reduced)}>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f0f0f5] mb-4 leading-tight">
                  Ready to find your next client?
                </h2>
                <p className="text-[#8888a0] text-lg mb-8 max-w-lg mx-auto">
                  Join hundreds of Nigerian businesses already using LeadGen OS
                  to fill their pipelines.
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
