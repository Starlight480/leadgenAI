"use client"

import { useEffect, useRef, useState } from "react"

/* ═══════════════════════════════════════════════════════════════
   DATA GRID — Subtle animated dot pattern (background layer)
   ═══════════════════════════════════════════════════════════════ */

export function DataGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let w = 0
    let h = 0

    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches

    interface Dot {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      pulse: number
      pulseSpeed: number
    }

    let dots: Dot[] = []

    function init() {
      w = canvas!.width = canvas!.offsetWidth * devicePixelRatio
      h = canvas!.height = canvas!.offsetHeight * devicePixelRatio
      ctx!.scale(devicePixelRatio, devicePixelRatio)

      const spacing = 80
      const cols = Math.ceil(canvas!.offsetWidth / spacing)
      const rows = Math.ceil(canvas!.offsetHeight / spacing)
      dots = []

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x: c * spacing + spacing / 2 + (Math.random() - 0.5) * 20,
            y: r * spacing + spacing / 2 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: 1 + Math.random() * 1.5,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.005 + Math.random() * 0.01,
          })
        }
      }
    }

    function draw() {
      if (!ctx || !canvas) return
      const cw = canvas.offsetWidth
      const ch = canvas.offsetHeight
      ctx.clearRect(0, 0, cw, ch)

      // Move dots
      for (const d of dots) {
        if (!prefersReduced) {
          d.x += d.vx
          d.y += d.vy
          d.pulse += d.pulseSpeed
          if (d.x < 0 || d.x > cw) d.vx *= -1
          if (d.y < 0 || d.y > ch) d.vy *= -1
        }

        const alpha = 0.04 + Math.sin(d.pulse) * 0.02
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(129, 140, 248, ${alpha})`
        ctx.fill()
      }

      // Draw connecting lines
      const maxDist = 120
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.06
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    init()
    draw()

    const ro = new ResizeObserver(() => {
      init()
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
      aria-hidden="true"
    />
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED PIPELINE — Hero background
   SVG dots flowing through Scout → Scribe → Dev → Reach nodes
   ═══════════════════════════════════════════════════════════════ */

export function AnimatedPipeline() {
  const prefersReduced =
    typeof window !== "undefined"
      ? matchMedia("(prefers-reduced-motion: reduce)").matches
      : false

  const nodes = [
    { label: "Scout", x: 120, y: 200 },
    { label: "Scribe", x: 370, y: 120 },
    { label: "Dev", x: 620, y: 200 },
    { label: "Reach", x: 870, y: 120 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 1000 320"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-auto"
        style={{ opacity: 0.12, filter: "blur(0.5px)" }}
      >
        {/* Connection lines */}
        {nodes.slice(0, -1).map((n, i) => (
          <line
            key={`line-${i}`}
            x1={n.x}
            y1={n.y}
            x2={nodes[i + 1].x}
            y2={nodes[i + 1].y}
            stroke="#818cf8"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.5"
          />
        ))}

        {/* Node circles */}
        {nodes.map((n, i) => (
          <g key={`node-${i}`}>
            <circle
              cx={n.x}
              cy={n.y}
              r="18"
              fill="none"
              stroke="#818cf8"
              strokeWidth="2"
              opacity="0.6"
            >
              {!prefersReduced && (
                <animate
                  attributeName="r"
                  values="18;22;18"
                  dur={`${2 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              )}
              {!prefersReduced && (
                <animate
                  attributeName="opacity"
                  values="0.6;1;0.6"
                  dur={`${2 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle cx={n.x} cy={n.y} r="4" fill="#818cf8" opacity="0.8" />
            <text
              x={n.x}
              y={n.y + 36}
              textAnchor="middle"
              fill="#818cf8"
              fontSize="11"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
              opacity="0.7"
              letterSpacing="1"
            >
              {n.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Flowing data dots along the path */}
        {!prefersReduced &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={`dot-${i}`} r="2.5" fill="#818cf8" opacity="0">
              <animateMotion
                dur={`${4 + i * 0.5}s`}
                repeatCount="indefinite"
                begin={`${i * 0.7}s`}
                path={`M${nodes[0].x},${nodes[0].y} L${nodes[1].x},${nodes[1].y} L${nodes[2].x},${nodes[2].y} L${nodes[3].x},${nodes[3].y}`}
              />
              <animate
                attributeName="opacity"
                values="0;0.8;0.8;0"
                keyTimes="0;0.15;0.85;1"
                dur={`${4 + i * 0.5}s`}
                repeatCount="indefinite"
                begin={`${i * 0.7}s`}
              />
            </circle>
          ))}
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD MOCK — CSS-only dashboard preview
   Dark card with stats, chart, lead cards
   ═══════════════════════════════════════════════════════════════ */

export function DashboardMock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[#0e0e16] border border-[#1e1e2a] rounded-xl overflow-hidden shadow-2xl shadow-black/50 ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1e1e2a] bg-[#111118]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/70" />
        </div>
        <div className="ml-3 flex-1 bg-[#1a1a24] rounded-md px-3 py-1 text-[10px] text-[#555570] font-mono">
          leadgen-os.app/dashboard
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Leads", value: "247", change: "+18%" },
            { label: "Websites Built", value: "89", change: "+12%" },
            { label: "Conversion", value: "34%", change: "+5%" },
          ].map((s, i) => (
            <div key={i} className="bg-[#14141c] rounded-lg p-3 border border-[#1e1e2a]">
              <div className="text-[9px] text-[#555570] uppercase tracking-wider mb-1">
                {s.label}
              </div>
              <div className="text-lg font-bold text-[#f0f0f5]">{s.value}</div>
              <div className="text-[10px] text-[#22c55e]">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="bg-[#14141c] rounded-lg p-3 border border-[#1e1e2a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#555570] uppercase tracking-wider">
              Pipeline Activity
            </span>
            <span className="text-[10px] text-[#818cf8]">Last 7 days</span>
          </div>
          <svg viewBox="0 0 280 60" className="w-full h-12">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,45 L40,38 L80,42 L120,28 L160,32 L200,18 L240,22 L280,8"
              fill="none"
              stroke="#818cf8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M0,45 L40,38 L80,42 L120,28 L160,32 L200,18 L240,22 L280,8 L280,60 L0,60Z"
              fill="url(#chartGrad)"
            />
          </svg>
        </div>

        {/* Lead cards */}
        <div className="space-y-2">
          {[
            {
              name: "Okafor Bakery",
              status: "Profiled",
              color: "#06b6d4",
              step: "Step 2/4",
            },
            {
              name: "Lagos Auto Hub",
              status: "Website Built",
              color: "#10b981",
              step: "Step 3/4",
            },
            {
              name: "Grace Fashion",
              status: "Contacted",
              color: "#f59e0b",
              step: "Step 4/4",
            },
          ].map((lead, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-[#14141c] rounded-lg px-3 py-2 border border-[#1e1e2a]"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: lead.color }}
                />
                <div>
                  <div className="text-xs font-medium text-[#f0f0f5]">
                    {lead.name}
                  </div>
                  <div className="text-[9px] text-[#555570]">{lead.step}</div>
                </div>
              </div>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${lead.color}15`,
                  color: lead.color,
                }}
              >
                {lead.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP ILLUSTRATION — Animated icon per pipeline step
   ═══════════════════════════════════════════════════════════════ */

type StepType = "scout" | "scribe" | "dev" | "reach"

export function StepIllustration({
  step,
  className = "",
}: {
  step: StepType
  className?: string
}) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {/* Common background glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(129,140,248,0.15), transparent 70%)",
        }}
      />

      <svg viewBox="0 0 120 100" className="w-full h-full max-w-[140px] max-h-[120px]">
        {step === "scout" && <ScoutIcon />}
        {step === "scribe" && <ScribeIcon />}
        {step === "dev" && <DevIcon />}
        {step === "reach" && <ReachIcon />}
      </svg>
    </div>
  )
}

function ScoutIcon() {
  return (
    <g>
      {/* Magnifying glass */}
      <circle
        cx="50"
        cy="42"
        r="22"
        fill="none"
        stroke="#818cf8"
        strokeWidth="2.5"
        opacity="0.8"
      />
      <line
        x1="66"
        y1="58"
        x2="80"
        y2="72"
        stroke="#818cf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Lens shine */}
      <path
        d="M40,32 Q45,28 52,30"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Floating data dots */}
      {[
        { cx: 38, cy: 38, delay: "0s" },
        { cx: 55, cy: 45, delay: "0.5s" },
        { cx: 44, cy: 50, delay: "1s" },
        { cx: 58, cy: 35, delay: "1.5s" },
        { cx: 42, cy: 32, delay: "2s" },
      ].map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="2" fill="#818cf8" opacity="0">
          <animate
            attributeName="opacity"
            values="0;0.7;0"
            dur="2s"
            repeatCount="indefinite"
            begin={d.delay}
          />
          <animate
            attributeName="cy"
            values={`${d.cy};${d.cy - 8}`}
            dur="2s"
            repeatCount="indefinite"
            begin={d.delay}
          />
        </circle>
      ))}
    </g>
  )
}

function ScribeIcon() {
  return (
    <g>
      {/* Document */}
      <rect
        x="28"
        y="18"
        width="44"
        height="58"
        rx="3"
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        opacity="0.7"
      />
      {/* Lines of text */}
      {[30, 38, 46, 54].map((y, i) => (
        <line
          key={i}
          x1="36"
          y1={y}
          x2={i === 3 ? "56" : "64"}
          y2={y}
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      ))}
      {/* Writing cursor / pen */}
      <g opacity="0.9">
        <line
          x1="68"
          y1="28"
          x2="78"
          y2="18"
          stroke="#818cf8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="78" cy="18" r="2" fill="#818cf8" />
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </g>
      {/* Blinking cursor on document */}
      <rect x="55" y="53" width="2" height="8" fill="#818cf8" opacity="0.8">
        <animate
          attributeName="opacity"
          values="0.8;0;0.8"
          dur="1s"
          repeatCount="indefinite"
        />
      </rect>
    </g>
  )
}

function DevIcon() {
  return (
    <g>
      {/* Code brackets */}
      <text
        x="25"
        y="58"
        fill="#818cf8"
        fontSize="36"
        fontFamily="monospace"
        fontWeight="bold"
        opacity="0.6"
      >
        {"{"}
      </text>
      <text
        x="78"
        y="58"
        fill="#818cf8"
        fontSize="36"
        fontFamily="monospace"
        fontWeight="bold"
        opacity="0.6"
      >
        {"}"}
      </text>
      {/* Building blocks / code lines */}
      {[36, 44, 52].map((y, i) => (
        <rect
          key={i}
          x="38"
          y={y}
          width={30 - i * 8}
          height="4"
          rx="2"
          fill="#818cf8"
          opacity="0.3"
        >
          <animate
            attributeName="width"
            values={`0;${30 - i * 8}`}
            dur="0.8s"
            begin={`${i * 0.2}s`}
            fill="freeze"
          />
        </rect>
      ))}
      {/* Building / construction indicator */}
      <rect x="48" y="62" width="24" height="12" rx="2" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.5">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>
      {/* Progress dots */}
      {[52, 58, 64].map((x, i) => (
        <circle key={i} cx={x} cy="68" r="1.5" fill="#818cf8" opacity="0">
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="1.5s"
            repeatCount="indefinite"
            begin={`${i * 0.3}s`}
          />
        </circle>
      ))}
    </g>
  )
}

function ReachIcon() {
  return (
    <g>
      {/* Paper plane */}
      <polygon
        points="22,40 68,20 58,48 42,42"
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <line
        x1="42"
        y1="42"
        x2="68"
        y2="20"
        stroke="#818cf8"
        strokeWidth="1.5"
        opacity="0.4"
      />
      {/* Send wave rings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx="72"
          cy="36"
          r={8 + i * 6}
          fill="none"
          stroke="#818cf8"
          strokeWidth="1"
          opacity="0"
        >
          <animate
            attributeName="r"
            values={`${6 + i * 5};${14 + i * 5}`}
            dur="2s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
          />
          <animate
            attributeName="opacity"
            values="0.5;0"
            dur="2s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
          />
        </circle>
      ))}
      {/* Trail dots */}
      {[
        { cx: 18, cy: 44, delay: "0.2s" },
        { cx: 12, cy: 48, delay: "0.5s" },
        { cx: 8, cy: 52, delay: "0.8s" },
      ].map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="1.5" fill="#818cf8" opacity="0">
          <animate
            attributeName="opacity"
            values="0;0.6;0"
            dur="1.5s"
            repeatCount="indefinite"
            begin={d.delay}
          />
        </circle>
      ))}
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PIPELINE FLOW — Large pipeline animation for features section
   Nodes light up as data flows through
   ═══════════════════════════════════════════════════════════════ */

export function PipelineFlow({ className = "" }: { className?: string }) {
  const stages = [
    { label: "Scout", x: 15, icon: "🔍" },
    { label: "Profile", x: 35, icon: "📝" },
    { label: "Build", x: 55, icon: "⚡" },
    { label: "Deploy", x: 75, icon: "🚀" },
  ]

  return (
    <div className={`relative w-full h-full ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Base connection line */}
        <line
          x1="60"
          y1="100"
          x2="340"
          y2="100"
          stroke="#818cf8"
          strokeWidth="1.5"
          opacity="0.2"
          strokeDasharray="4 4"
        />

        {/* Animated flowing line */}
        <line
          x1="60"
          y1="100"
          x2="340"
          y2="100"
          stroke="#818cf8"
          strokeWidth="2"
          opacity="0.5"
          strokeDasharray="20 80"
          strokeDashoffset="0"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-200"
            dur="3s"
            repeatCount="indefinite"
          />
        </line>

        {/* Stage nodes */}
        {stages.map((s, i) => (
          <g key={i}>
            {/* Glow circle */}
            <circle
              cx={s.x * 4}
              cy="100"
              r="28"
              fill="rgba(129, 140, 248, 0.05)"
              stroke="#818cf8"
              strokeWidth="1"
              opacity="0.3"
            >
              <animate
                attributeName="r"
                values="28;32;28"
                dur={`${2 + i * 0.4}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.2;0.5;0.2"
                dur={`${2 + i * 0.4}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* Inner circle */}
            <circle
              cx={s.x * 4}
              cy="100"
              r="20"
              fill="#0e0e16"
              stroke="#818cf8"
              strokeWidth="1.5"
              opacity="0.6"
            />
            {/* Stage number */}
            <text
              x={s.x * 4}
              y="104"
              textAnchor="middle"
              fill="#818cf8"
              fontSize="12"
              fontWeight="bold"
              fontFamily="Inter, sans-serif"
              opacity="0.9"
            >
              {i + 1}
            </text>
            {/* Label */}
            <text
              x={s.x * 4}
              y="145"
              textAnchor="middle"
              fill="#818cf8"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
              opacity="0.7"
              letterSpacing="1"
            >
              {s.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Flowing data particles */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={`particle-${i}`} r="3" fill="#818cf8" opacity="0">
            <animateMotion
              dur={`${2.5 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${i * 0.6}s`}
              path="M60,100 L140,100 L220,100 L300,100 L340,100"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;1;0"
              keyTimes="0;0.1;0.3;0.8;1"
              dur={`${2.5 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${i * 0.6}s`}
            />
            <animate
              attributeName="r"
              values="2;3;2"
              dur={`${2.5 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${i * 0.6}s`}
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CTA BACKGROUND — Animated gradient for bottom CTA section
   ═══════════════════════════════════════════════════════════════ */

export function CtaBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Radial gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(129,140,248,0.08), transparent 70%)",
        }}
      />
      {/* Floating orbs */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
        <circle cx="100" cy="80" r="60" fill="rgba(129,140,248,0.03)">
          <animate
            attributeName="cy"
            values="80;95;80"
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="300" cy="120" r="80" fill="rgba(129,140,248,0.02)">
          <animate
            attributeName="cy"
            values="120;105;120"
            dur="7s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="200" cy="100" r="40" fill="rgba(129,140,248,0.04)">
          <animate
            attributeName="cx"
            values="200;210;200"
            dur="5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE SCOUT ILLUSTRATION — Large visual for AI scouting feature
   Shows dots being found on a map-like grid
   ═══════════════════════════════════════════════════════════════ */

export function FeatureScoutIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-full ${className}`} aria-hidden="true">
      <svg viewBox="0 0 500 250" className="w-full h-full">
        {/* Grid background */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 45}
            y1="0"
            x2={i * 45}
            y2="250"
            stroke="#818cf8"
            strokeWidth="0.5"
            opacity="0.08"
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 50}
            x2="500"
            y2={i * 50}
            stroke="#818cf8"
            strokeWidth="0.5"
            opacity="0.08"
          />
        ))}

        {/* Business location dots — some found, some not */}
        {[
          { x: 80, y: 60, found: true },
          { x: 180, y: 40, found: false },
          { x: 260, y: 90, found: true },
          { x: 350, y: 55, found: false },
          { x: 120, y: 150, found: true },
          { x: 220, y: 170, found: false },
          { x: 380, y: 140, found: true },
          { x: 300, y: 180, found: false },
          { x: 420, y: 100, found: true },
          { x: 160, y: 110, found: false },
        ].map((p, i) => (
          <g key={i}>
            {p.found ? (
              <>
                <circle cx={p.x} cy={p.y} r="6" fill="#818cf8" opacity="0.15" />
                <circle cx={p.x} cy={p.y} r="3" fill="#818cf8" opacity="0.8">
                  <animate
                    attributeName="r"
                    values="3;4;3"
                    dur={`${2 + (i % 3) * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Checkmark */}
                <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0">
                  <animate
                    attributeName="opacity"
                    values="0;0.4;0"
                    dur="3s"
                    repeatCount="indefinite"
                    begin={`${i * 0.4}s`}
                  />
                  <animate
                    attributeName="r"
                    values="10;16"
                    dur="3s"
                    repeatCount="indefinite"
                    begin={`${i * 0.4}s`}
                  />
                </circle>
              </>
            ) : (
              <circle cx={p.x} cy={p.y} r="2" fill="#818cf8" opacity="0.2" />
            )}
          </g>
        ))}

        {/* Scanning line */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="250"
          stroke="#818cf8"
          strokeWidth="1.5"
          opacity="0.3"
        >
          <animate
            attributeName="x1"
            values="0;500;0"
            dur="8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values="0;500;0"
            dur="8s"
            repeatCount="indefinite"
          />
        </line>
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE PIPELINE ILLUSTRATION — Large visual for pipeline tracking
   Shows a funnel-like flow
   ═══════════════════════════════════════════════════════════════ */

export function FeaturePipelineIllustration({
  className = "",
}: {
  className?: string
}) {
  return (
    <div className={`relative w-full h-full ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 250" className="w-full h-full">
        {/* Funnel stages */}
        {[
          { y: 20, w: 160, label: "1,000 leads" },
          { y: 80, w: 120, label: "340 profiled" },
          { y: 140, w: 80, label: "89 built" },
          { y: 200, w: 40, label: "34 closed" },
        ].map((s, i) => (
          <g key={i}>
            <rect
              x={(200 - s.w) / 2}
              y={s.y}
              width={s.w}
              height={40}
              rx="6"
              fill="rgba(129,140,248,0.06)"
              stroke="#818cf8"
              strokeWidth="1"
              opacity="0.5"
            >
              <animate
                attributeName="opacity"
                values="0.3;0.6;0.3"
                dur={`${2.5 + i * 0.3}s`}
                repeatCount="indefinite"
              />
            </rect>
            <text
              x="100"
              y={s.y + 24}
              textAnchor="middle"
              fill="#818cf8"
              fontSize="9"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
              opacity="0.7"
            >
              {s.label}
            </text>
            {/* Arrow down */}
            {i < 3 && (
              <text
                x="100"
                y={s.y + 52}
                textAnchor="middle"
                fill="#818cf8"
                fontSize="12"
                opacity="0.3"
              >
                ↓
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
