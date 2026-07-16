"use client"

import { useRef, useCallback, useState, Fragment } from "react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion"
import Link from "next/link"
import {
  Menu, X, ArrowRight, Check, ChevronRight,
  Search, PenTool, Code2, Send,
  Target, UserCheck, Globe, BarChart3,
  Quote, Zap,
} from "lucide-react"
import {
  AnimatedPipeline, StepIllustration,
  FeatureScoutIllustration, FeaturePipelineIllustration,
  PipelineFlow,
} from "@/components/landing-visuals"

const STEPS = [
  { icon: Search, label: "Scout", desc: "Discovers businesses without websites in your target area", step: "scout" as const },
  { icon: PenTool, label: "Scribe", desc: "Profiles each business and creates a custom offer", step: "scribe" as const },
  { icon: Code2, label: "Dev", desc: "Generates a professional website in minutes", step: "dev" as const },
  { icon: Send, label: "Reach", desc: "Sends personalised outreach via email or WhatsApp", step: "reach" as const },
]

const FEATURES = [
  { icon: Target, title: "AI-Powered Scouting", desc: "Automatically find businesses that need websites" },
  { icon: UserCheck, title: "Smart Profiling", desc: "Generate detailed business profiles with pricing recommendations" },
  { icon: Globe, title: "Instant Website Generation", desc: "Create professional landing pages in seconds" },
  { icon: Send, title: "Multi-Channel Outreach", desc: "Email, WhatsApp, Telegram — all from one dashboard" },
  { icon: BarChart3, title: "Pipeline Tracking", desc: "Watch your leads move from discovery to deployment" },
]

const STATS = [
  { value: 10, prefix: "", suffix: "×", label: "Faster than manual prospecting" },
  { value: 3, prefix: "", suffix: " min", label: "Average time from scout to profile" },
  { value: 0, prefix: "₦", suffix: " upfront", label: "Pay only when you close" },
]

function fadeUp(delay = 0, reduced = false) {
  return {
    initial: reduced ? (false as const) : { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 } as const,
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }
}

export default function FeaturesPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const navRef = useRef<HTMLElement>(null)
  const reduced = false

  const { scrollYProgress } = useScroll({
    target: useRef<HTMLDivElement>(null),
    offset: ["start end", "end start"],
  })
  const clipPath = useTransform(scrollYProgress, [0.1, 0.5], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"])
  const opacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])

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
            <Link href="/features" className="text-sm text-[#f0f0f5] font-medium transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-[#818cf8] text-white hover:bg-[#6366f1] transition-colors">
              Get Started
            </Link>
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
                <Link href="/pricing" onClick={() => setMenuOpen(false)} className="block w-full text-left text-sm text-[#8888a0] hover:text-[#f0f0f5] py-3 transition-colors">Pricing</Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-medium px-4 py-3 rounded-lg bg-[#818cf8] text-white text-center mt-3 hover:bg-[#6366f1] transition-colors">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ════════════════════════ HOW IT WORKS ════════════════════════ */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeUp(0)}>
            <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">The Pipeline</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">
              Four steps. Fully automated.
            </h2>
            <p className="text-[#8888a0] max-w-xl mx-auto">
              From discovery to deployment, every stage runs on autopilot.
              You review. The AI does the work.
            </p>
          </motion.div>

          <div className="hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-start gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Fragment key={i}>
                  <motion.div {...fadeUp(i * 0.15)} whileHover={{ y: -6, transition: { duration: 0.25 } }}>
                    <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                      <div className="relative h-32 overflow-hidden bg-[#0a0a0e]">
                        <StepIllustration step={step.step} className="w-full h-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent" />
                        <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#818cf8] flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-1.5">Step {i + 1}</div>
                        <h3 className="text-base font-semibold text-[#f0f0f5] mb-1.5">{step.label}</h3>
                        <p className="text-sm text-[#8888a0] leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <div className="flex items-center pt-16">
                      <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.15 + 0.3 }}>
                        <ChevronRight className="w-5 h-5 text-[#555570]" />
                      </motion.div>
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>

          <div className="lg:hidden grid grid-cols-2 gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={i} {...fadeUp(i * 0.15)} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30">
                    <div className="relative h-24 overflow-hidden bg-[#0a0a0e]">
                      <StepIllustration step={step.step} className="w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent" />
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#818cf8] flex items-center justify-center">
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-1">Step {i + 1}</div>
                      <h3 className="text-sm font-semibold text-[#f0f0f5] mb-1">{step.label}</h3>
                      <p className="text-xs text-[#8888a0] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════ IMAGE REVEAL ════════════════════════ */}
      <section className="py-0 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <motion.div style={{ clipPath, opacity }} className="relative aspect-[16/9] md:aspect-[21/9]">
              <div className="absolute inset-0 bg-[#0a0a0e]">
                <PipelineFlow className="w-full h-full" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c10] via-[#0c0c10]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] via-transparent to-[#0c0c10]/40" />
            </motion.div>
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-xl px-8 md:px-16">
                <motion.div {...fadeUp(0.2)}>
                  <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-4">Live Dashboard</p>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f0f0f5] mb-4 leading-tight">
                    See every lead. <br /><span className="text-[#818cf8]">At a glance.</span>
                  </h2>
                  <p className="text-[#8888a0] text-lg leading-relaxed">
                    Real-time pipeline visibility. From first scout to final deployment — nothing slips through.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ FEATURES ════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="mb-16" {...fadeUp(0)}>
            <p className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest mb-3">Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f0f0f5] mb-4">Your pipeline, fully automated</h2>
            <p className="text-[#8888a0] max-w-xl">Everything you need to find, profile, and convert businesses — without lifting a finger.</p>
          </motion.div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div {...fadeUp(0)} whileHover={{ y: -4, transition: { duration: 0.25 } }} className="lg:col-span-2 relative group">
                <div className="relative bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30">
                  <div className="relative h-48 md:h-56 overflow-hidden bg-[#0a0a0e]">
                    <FeatureScoutIllustration className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/40 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-[#818cf8]" />
                        <span className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest">AI-Powered Scouting</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#f0f0f5] mb-1">Find businesses that need you</h3>
                      <p className="text-sm text-[#8888a0]">Automatically discovers businesses without websites in your target area — updated in real time.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div {...fadeUp(0.1)} whileHover={{ y: -4, transition: { duration: 0.25 } }}>
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                  <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                    <UserCheck className="w-5 h-5 text-[#818cf8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">Smart Profiling</h3>
                  <p className="text-sm text-[#8888a0] leading-relaxed">Generate detailed business profiles with pricing recommendations — before you even make contact.</p>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div {...fadeUp(0)} whileHover={{ y: -4, transition: { duration: 0.25 } }}>
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                  <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                    <Globe className="w-5 h-5 text-[#818cf8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">Instant Website Generation</h3>
                  <p className="text-sm text-[#8888a0] leading-relaxed">Professional landing pages created in seconds, ready to deploy with one click.</p>
                </div>
              </motion.div>
              <motion.div {...fadeUp(0.1)} whileHover={{ y: -4, transition: { duration: 0.25 } }}>
                <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-6 h-full transition-all duration-300 hover:border-[#818cf8]/30 hover:shadow-lg hover:shadow-[#818cf8]/5">
                  <div className="w-10 h-10 rounded-lg bg-[#818cf8]/10 flex items-center justify-center mb-4">
                    <Send className="w-5 h-5 text-[#818cf8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#f0f0f5] mb-2">Multi-Channel Outreach</h3>
                  <p className="text-sm text-[#8888a0] leading-relaxed">Email, WhatsApp, Telegram — reach them wherever they are, all from one dashboard.</p>
                </div>
              </motion.div>
              <motion.div {...fadeUp(0.2)} whileHover={{ y: -4, transition: { duration: 0.25 } }} className="relative group">
                <div className="relative bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#818cf8]/30">
                  <div className="relative h-48 md:h-auto md:min-h-[240px] overflow-hidden bg-[#0a0a0e]">
                    <FeaturePipelineIllustration className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/50 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-[#818cf8]" />
                        <span className="text-[10px] font-semibold text-[#818cf8] uppercase tracking-widest">Pipeline Tracking</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#f0f0f5]">Watch leads convert</h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ STATS ════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-[#f0f0f5] mb-3">
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <p className="text-sm text-[#8888a0]">{stat.label}</p>
              </motion.div>
            ))}
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