"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import {
  motion,
  AnimatePresence,
} from "framer-motion"
import Link from "next/link"
import {
  Menu, X, ArrowRight, Check, Quote, Zap,
} from "lucide-react"

const PLANS = [
  {
    name: "Starter",
    monthlyPrice: "₦0",
    yearlyPrice: "₦0",
    yearlyBilled: "",
    period: "/mo",
    description: "Free forever. Perfect for getting started.",
    features: ["5 Scout campaigns/month", "Basic profiling", "Pipeline tracking", "Email support"],
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
    features: ["Unlimited Scout campaigns", "Advanced AI profiling", "Website generation", "Multi-channel outreach", "Telegram notifications", "Priority support"],
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
    features: ["Everything in Growth", "Custom branding", "API access", "White-label deployment", "Dedicated account manager", "Custom integrations"],
    popular: false,
    cta: "Contact Sales",
  },
]

const TESTIMONIALS = [
  {
    quote: "We went from cold-calling 50 businesses a day to having 200 qualified leads in our pipeline within a week. LeadGen OS changed everything.",
    author: "Chidi Okafor",
    role: "Founder, WebCraft Lagos",
  },
  {
    quote: "The scouting is frighteningly good. It found a whole cluster of businesses we'd never have discovered manually.",
    author: "Amina Bello",
    role: "Growth Lead, DigitalBridge NG",
  },
  {
    quote: "Three minutes from finding a business to having a ready-to-send proposal. That's not hyperbole — we timed it.",
    author: "Tunde Adebayo",
    role: "CEO, SiteForge Studios",
  },
]

function fadeUp(delay = 0, reduced = false) {
  return {
    initial: reduced ? (false as const) : { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 } as const,
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }
}

export default function PricingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isYearly, setIsYearly] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const reduced = false

  const handleNavMouse = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return
    const rect = navRef.current.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  return (
    <div className="dark" style={{ backgroundColor: "#0a0a0e", minHeight: "100vh" }}>
      {/* ════════════════════════ NAVBAR ════════════════════════ */}
      <motion.nav
        ref={navRef}
        initial={{ opacity: 0, y: -10 }}
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
          <Link href="/" className="text-lg font-bold tracking-tight text-[#f0f0f5]">
            LeadGen <span className="text-[#818cf8]">OS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-[#f0f0f5] font-medium transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-[#818cf8] text-white hover:bg-[#6366f1] transition-colors">Get Started</Link>
          </div>
          <button className="md:hidden text-[#8888a0] hover:text-[#f0f0f5] cursor-pointer" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-t border-[#1e1e2a] bg-[#0a0a0e]">
              <div className="px-6 py-4 space-y-1">
                <Link href="/" onClick={() => setMenuOpen(false)} className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors">Home</Link>
                <Link href="/features" onClick={() => setMenuOpen(false)} className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors">Features</Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-medium px-4 py-3 rounded-lg bg-[#818cf8] text-white text-center mt-3 hover:bg-[#6366f1] transition-colors">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="pt-32 pb-12 px-6 text-center">
        <motion.div {...fadeUp(0)}>
          <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f0f0f5] mb-4">
            Simple. Transparent. No surprises.
          </h2>
          <p className="text-[#8888a0] max-w-xl mx-auto">
            Start free, scale when you&apos;re ready. Pay monthly or save 20% with annual billing.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div className="flex items-center justify-center gap-3 mb-12 mt-8" {...fadeUp(0.1)}>
          <span className={`text-sm font-medium transition-colors cursor-pointer ${!isYearly ? "text-[#f0f0f5]" : "text-[#555570]"}`} onClick={() => setIsYearly(false)}>Monthly</span>
          <button onClick={() => setIsYearly(!isYearly)} className="relative w-12 h-6 rounded-full bg-[#2a2a36] transition-colors duration-300 cursor-pointer" aria-label="Toggle billing period">
            <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-[#818cf8]" animate={{ left: isYearly ? "26px" : "2px" }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
          </button>
          <span className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${isYearly ? "text-[#f0f0f5]" : "text-[#555570]"}`} onClick={() => setIsYearly(true)}>
            Yearly
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#818cf8]/15 text-[#818cf8] text-[10px] font-semibold uppercase tracking-wider">Save 20%</span>
          </span>
        </motion.div>

        {/* Plans */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              {...fadeUp(i * 0.1)}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`relative ${plan.popular ? "md:-mt-4 md:mb-[-16px]" : ""}`}
            >
              <div className={`bg-[#111118] border rounded-xl p-8 h-full transition-all duration-300 ${plan.popular ? "border-[#818cf8] shadow-lg shadow-[#818cf8]/10" : "border-[#1e1e2a] hover:border-[#2a2a36]"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-[#818cf8] text-white text-xs font-medium">Most Popular</div>
                )}
                <h3 className="text-lg font-semibold text-[#f0f0f5] mb-2">{plan.name}</h3>
                <AnimatePresence mode="wait">
                  <motion.div key={isYearly ? "yearly" : "monthly"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[#f0f0f5]">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                      {plan.period && <span className="text-sm text-[#8888a0]">{plan.period}</span>}
                    </div>
                    {isYearly && plan.yearlyBilled && <p className="text-xs text-[#555570] mt-1">{plan.yearlyBilled}</p>}
                  </motion.div>
                </AnimatePresence>
                <p className="text-sm text-[#8888a0] mb-6 leading-relaxed">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-[#8888a0]">
                      <Check className="w-4 h-4 text-[#818cf8] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular ? "bg-[#818cf8] text-white hover:bg-[#6366f1]" : "border border-[#2a2a36] text-[#8888a0] hover:text-[#f0f0f5] hover:border-[#3a3a48]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ TESTIMONIALS ════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeUp(0)}>
            <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">What people say</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5]">Trusted by builders across Nigeria</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} {...fadeUp(i * 0.12)} whileHover={{ y: -4, transition: { duration: 0.25 } }}>
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full flex flex-col transition-all duration-300 hover:border-[#818cf8]/30">
                  <Quote className="w-8 h-8 text-[#818cf8]/20 mb-4" />
                  <p className="text-sm text-[#8888a0] leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="border-t border-[#1e1e2a] pt-4">
                    <p className="text-sm font-semibold text-[#f0f0f5]">{t.author}</p>
                    <p className="text-xs text-[#555570]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ CTA ════════════════════════ */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div {...fadeUp(0)}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">Ready to find your next client?</h2>
            <p className="text-[#8888a0] mb-8">Start finding, profiling, and closing businesses today.</p>
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[#818cf8] text-white font-medium hover:bg-[#6366f1] transition-all text-base hover:gap-3">
              Get Started Free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer className="border-t border-[#1e1e2a] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight text-[#f0f0f5]">
              LeadGen <span className="text-[#818cf8]">OS</span>
            </Link>
            <p className="text-xs text-[#555570] mt-2">© 2026 LeadGen OS. Built for Nigerian businesses.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}