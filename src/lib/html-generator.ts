/**
 * HTML Site Generator
 * Takes a Dev agent spec (JSON) and produces a complete, self-contained,
 * deployable single-file HTML website.
 */

interface Spec {
  site_type?: string
  pages?: Record<string, unknown> | null
  color_palette?: Record<string, unknown> | null
  content?: Record<string, unknown> | null
  tech_stack?: string[] | null
  site_title?: string
}

interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

interface ServiceItem {
  name: string
  description: string
  price?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pick<T>(...vals: unknown[]): T | undefined {
  for (const v of vals) {
    if (v != null && v !== '') return v as T
  }
  return undefined
}

/** Safely read a nested value like content.hero.headline */
function dig(obj: Record<string, unknown> | null | undefined, ...keys: string[]): unknown {
  let cur: unknown = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return cur
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function darken(hex: string, pct: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const f = 1 - pct / 100
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ---------------------------------------------------------------------------
// Extract helpers — support both the flat and nested spec formats
// ---------------------------------------------------------------------------

function extractColors(palette: Record<string, unknown> | null | undefined): ColorPalette {
  const p = palette || {}
  return {
    primary: String(p.primary || '#1a3a5c'),
    secondary: String(p.secondary || '#7eb8da'),
    accent: String(p.accent || '#ffffff'),
    background: String(p.background || p.bg || '#ffffff'),
    text: String(p.text || '#333333'),
  }
}

function extractServices(content: Record<string, unknown> | null | undefined): ServiceItem[] {
  if (!content) return []

  // Nested format: content.services.items[]
  const nestedItems = dig(content, 'services', 'items')
  if (Array.isArray(nestedItems)) return nestedItems as ServiceItem[]

  // Flat format: content.services[]
  const flatServices = content.services
  if (Array.isArray(flatServices)) return flatServices as ServiceItem[]

  return []
}

function extractHeroHeadline(content: Record<string, unknown> | null | undefined): string {
  if (!content) return 'Welcome'
  // Nested: content.hero.headline
  const nested = dig(content, 'hero', 'headline')
  if (nested) return String(nested)
  // Flat: content.hero_headline
  const flat = content.hero_headline
  if (flat) return String(flat)
  return 'Welcome'
}

function extractHeroSub(content: Record<string, unknown> | null | undefined): string {
  if (!content) return ''
  const nested = dig(content, 'hero', 'subheadline')
  if (nested) return String(nested)
  const flat = content.hero_subheadline
  if (flat) return String(flat)
  return ''
}

function extractAboutText(content: Record<string, unknown> | null | undefined): string {
  if (!content) return ''
  const nested = dig(content, 'about', 'text')
  if (nested) return String(nested)
  const flat = content.about_text
  if (flat) return String(flat)
  return ''
}

function extractCtaText(content: Record<string, unknown> | null | undefined, defaultText: string): string {
  if (!content) return defaultText
  const nested = dig(content, 'cta', 'text')
  if (nested) return String(nested)
  const flat = content.cta_text
  if (flat) return String(flat)
  return defaultText
}

function extractContactText(content: Record<string, unknown> | null | undefined): string {
  if (!content) return ''
  const nested = dig(content, 'contact', 'text')
  if (nested) return String(nested)
  const flat = content.contact_text
  if (flat) return String(flat)
  return ''
}

function extractSections(pages: Record<string, unknown> | null | undefined): string[] {
  if (!pages) return ['hero', 'about', 'services', 'contact']

  // Nested format: pages.home.sections[]
  const nested = dig(pages, 'home', 'sections')
  if (Array.isArray(nested)) return nested.map(String)

  // Flat format: pages.structure[]
  const flat = (pages as Record<string, unknown>).structure
  if (Array.isArray(flat)) return flat.map(String)

  return ['hero', 'about', 'services', 'contact']
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateHTML(
  spec: Spec,
  businessName: string,
  category: string
): string {
  const colors = extractColors(spec.color_palette)
  const sections = extractSections(spec.pages)
  const heroHeadline = extractHeroHeadline(spec.content)
  const heroSub = extractHeroSub(spec.content)
  const aboutText = extractAboutText(spec.content)
  const services = extractServices(spec.content)
  const ctaText = extractCtaText(spec.content, 'Get In Touch')
  const contactText = extractContactText(spec.content)
  const siteTitle = spec.site_title || `${businessName} — ${category}`

  const year = new Date().getFullYear()
  const hasSections = (s: string) => sections.includes(s)

  // Category-specific emoji/icon
  const categoryIcons: Record<string, string> = {
    restaurant: '🍽️',
    salon: '💇',
    barbershop: '✂️',
    hotel: '🏨',
    pharmacy: '💊',
    church: '⛪',
    supermarket: '🛒',
    gym: '💪',
    school: '📚',
    clinic: '🏥',
    law: '⚖️',
    mechanic: '🔧',
    catering: '🎂',
    photography: '📸',
    fashion: '👗',
  }
  const catIcon = categoryIcons[category.toLowerCase()] || '💼'

  // Build HTML string
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(siteTitle)}</title>
<meta name="description" content="${esc(heroHeadline)} — ${esc(heroSub || businessName)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --primary: ${colors.primary};
  --secondary: ${colors.secondary};
  --accent: ${colors.accent};
  --bg: ${colors.background};
  --text: ${colors.text};
  --text-light: ${withAlpha(colors.text, 0.7)};
  --card-bg: #ffffff;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
  --card-shadow-hover: 0 4px 12px rgba(0,0,0,0.12);
  --radius: 12px;
  --max-width: 1120px;
  --section-gap: 80px;
}

html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ─── NAVBAR ─────────────────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  transition: box-shadow 0.3s ease;
}

.navbar.scrolled {
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
}

.navbar-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--primary);
  font-weight: 700;
  font-size: 1.15rem;
}

.navbar-brand .brand-icon {
  font-size: 1.4rem;
}

.navbar-links {
  display: flex;
  gap: 32px;
  list-style: none;
}

.navbar-links a {
  text-decoration: none;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.navbar-links a:hover { opacity: 1; }

.navbar-cta {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  background: var(--primary);
  color: var(--accent) !important;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  opacity: 1 !important;
  transition: transform 0.2s, opacity 0.2s;
}

.navbar-cta:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

/* Mobile nav toggle */
.nav-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text);
}

@media (max-width: 768px) {
  .nav-toggle { display: block; }
  .navbar-links {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(12px);
    flex-direction: column;
    align-items: center;
    gap: 0;
    padding: 16px 0;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .navbar-links.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  .navbar-links li {
    width: 100%;
    text-align: center;
  }
  .navbar-links a, .navbar-cta {
    display: block;
    padding: 14px 24px;
    border-radius: 0;
  }
}

/* ─── HERO ───────────────────────────────────────────────────────── */
.hero {
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
  background: linear-gradient(165deg, ${withAlpha(colors.primary, 0.03)} 0%, ${withAlpha(colors.secondary, 0.08)} 100%);
  position: relative;
}

.hero-content {
  max-width: 720px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: ${withAlpha(colors.primary, 0.08)};
  color: var(--primary);
  border-radius: 100px;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 24px;
  letter-spacing: 0.02em;
}

.hero h1 {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 800;
  line-height: 1.15;
  color: var(--primary);
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}

.hero p {
  font-size: clamp(1.05rem, 2vw, 1.2rem);
  color: var(--text-light);
  margin-bottom: 36px;
  line-height: 1.7;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--primary);
  color: var(--accent);
  box-shadow: 0 2px 8px ${withAlpha(colors.primary, 0.25)};
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px ${withAlpha(colors.primary, 0.35)};
}

.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 2px solid ${withAlpha(colors.primary, 0.2)};
}

.btn-outline:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

/* ─── SECTIONS ───────────────────────────────────────────────────── */
section {
  padding: var(--section-gap) 24px;
}

.section-inner {
  max-width: var(--max-width);
  margin: 0 auto;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--secondary);
  margin-bottom: 12px;
}

.section-title {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.section-desc {
  font-size: 1.05rem;
  color: var(--text-light);
  max-width: 560px;
  line-height: 1.7;
}

/* ─── ABOUT ──────────────────────────────────────────────────────── */
.about-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

.about-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 40px;
}

.stat-card {
  padding: 24px;
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  text-align: center;
}

.stat-card .stat-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
}

.stat-card .stat-label {
  font-size: 0.82rem;
  color: var(--text-light);
  margin-top: 4px;
  font-weight: 500;
}

.about-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.about-icon-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.about-icon-card {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  background: var(--card-bg);
}

.about-icon-card:nth-child(1) { background: ${withAlpha(colors.primary, 0.06)}; }
.about-icon-card:nth-child(2) { background: ${withAlpha(colors.secondary, 0.1)}; transform: translateY(16px); }
.about-icon-card:nth-child(3) { background: ${withAlpha(colors.secondary, 0.1)}; transform: translateY(-16px); }
.about-icon-card:nth-child(4) { background: ${withAlpha(colors.primary, 0.06)}; }

@media (max-width: 768px) {
  .about-layout { grid-template-columns: 1fr; gap: 40px; }
  .about-visual { order: -1; }
}

/* ─── SERVICES ───────────────────────────────────────────────────── */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.service-card {
  padding: 32px;
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  transition: transform 0.25s, box-shadow 0.25s;
  border: 1px solid rgba(0,0,0,0.04);
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}

.service-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.service-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${withAlpha(colors.primary, 0.06)};
  border-radius: 10px;
  flex-shrink: 0;
}

.service-card h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--primary);
}

.service-card p {
  font-size: 0.92rem;
  color: var(--text-light);
  line-height: 1.65;
}

.service-price {
  display: inline-block;
  margin-top: 14px;
  padding: 4px 12px;
  background: ${withAlpha(colors.primary, 0.06)};
  color: var(--primary);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* ─── CTA ────────────────────────────────────────────────────────── */
.cta-section {
  background: var(--primary);
  text-align: center;
  padding: 80px 24px;
}

.cta-section h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 16px;
}

.cta-section p {
  color: ${withAlpha('#ffffff', 0.75)};
  font-size: 1.05rem;
  margin-bottom: 32px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.cta-section .btn {
  background: var(--accent);
  color: var(--primary);
}

.cta-section .btn:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

/* ─── CONTACT ────────────────────────────────────────────────────── */
.contact-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  margin-top: 48px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.contact-item-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: ${withAlpha(colors.primary, 0.06)};
  border-radius: 10px;
  flex-shrink: 0;
}

.contact-item-text h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 2px;
}

.contact-item-text p, .contact-item-text a {
  font-size: 0.92rem;
  color: var(--text-light);
  text-decoration: none;
  line-height: 1.5;
}

.contact-item-text a:hover {
  color: var(--primary);
}

.contact-form {
  background: var(--card-bg);
  padding: 32px;
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
}

.contact-form h3 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  font-size: 0.92rem;
  font-family: inherit;
  transition: border-color 0.2s;
  background: #f9fafb;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  background: #fff;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

@media (max-width: 768px) {
  .contact-layout { grid-template-columns: 1fr; gap: 40px; }
}

/* ─── FOOTER ─────────────────────────────────────────────────────── */
.footer {
  background: ${darken(colors.primary, 15)};
  color: ${withAlpha('#ffffff', 0.7)};
  padding: 48px 24px 24px;
}

.footer-inner {
  max-width: var(--max-width);
  margin: 0 auto;
}

.footer-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid ${withAlpha('#ffffff', 0.1)};
}

.footer-brand {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
}

.footer-brand-desc {
  font-size: 0.88rem;
  line-height: 1.6;
  max-width: 320px;
}

.footer h4 {
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${withAlpha('#ffffff', 0.5)};
  margin-bottom: 16px;
}

.footer ul {
  list-style: none;
}

.footer ul li { margin-bottom: 10px; }

.footer ul a {
  color: ${withAlpha('#ffffff', 0.7)};
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.footer ul a:hover { color: #ffffff; }

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  font-size: 0.82rem;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .footer-top {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .services-grid {
    grid-template-columns: 1fr;
  }
  .about-stats {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

/* ─── UTILITIES ──────────────────────────────────────────────────── */
.text-center { text-align: center; }
.mx-auto { margin-left: auto; margin-right: auto; }
</style>
</head>
<body>

<!-- ═══════════════ NAVBAR ═══════════════ -->
<nav class="navbar" id="navbar">
  <div class="navbar-inner">
    <a href="#" class="navbar-brand">
      <span class="brand-icon">${catIcon}</span>
      ${esc(businessName)}
    </a>
    <button class="nav-toggle" id="navToggle" aria-label="Menu">&#9776;</button>
    <ul class="navbar-links" id="navLinks">
      ${hasSections('about') ? '<li><a href="#about">About</a></li>' : ''}
      ${services.length > 0 ? '<li><a href="#services">Services</a></li>' : ''}
      ${hasSections('contact') ? '<li><a href="#contact">Contact</a></li>' : ''}
      <li><a href="#contact" class="navbar-cta">${esc(ctaText)}</a></li>
    </ul>
  </div>
</nav>

<!-- ═══════════════ HERO ═══════════════ -->
${hasSections('hero') ? `
<section class="hero" id="hero">
  <div class="hero-content">
    <div class="hero-badge">${catIcon} ${esc(category)}</div>
    <h1>${esc(heroHeadline)}</h1>
    ${heroSub ? `<p>${esc(heroSub)}</p>` : ''}
    <div class="hero-buttons">
      <a href="#contact" class="btn btn-primary">${esc(ctaText)}</a>
      ${services.length > 0 ? '<a href="#services" class="btn btn-outline">View Services</a>' : ''}
    </div>
  </div>
</section>
` : ''}

<!-- ═══════════════ ABOUT ═══════════════ -->
${hasSections('about') && aboutText ? `
<section id="about">
  <div class="section-inner">
    <div class="about-layout">
      <div>
        <div class="section-label">About Us</div>
        <h2 class="section-title">${esc(businessName)}</h2>
        <div class="section-desc">${esc(aboutText)}</div>
        <div class="about-stats">
          <div class="stat-card">
            <div class="stat-number">${services.length || 1}+</div>
            <div class="stat-label">Services</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">100%</div>
            <div class="stat-label">Satisfaction</div>
          </div>
        </div>
      </div>
      <div class="about-visual">
        <div class="about-icon-grid">
          <div class="about-icon-card">${catIcon}</div>
          <div class="about-icon-card">⭐</div>
          <div class="about-icon-card">🏆</div>
          <div class="about-icon-card">🤝</div>
        </div>
      </div>
    </div>
  </div>
</section>
` : ''}

<!-- ═══════════════ SERVICES ═══════════════ -->
${services.length > 0 ? `
<section id="services" style="background: ${withAlpha(colors.primary, 0.02)}">
  <div class="section-inner">
    <div class="text-center">
      <div class="section-label mx-auto">What We Offer</div>
      <h2 class="section-title mx-auto">Our Services</h2>
      <p class="section-desc mx-auto">Quality ${esc(category.toLowerCase())} services tailored for you</p>
    </div>
    <div class="services-grid">
      ${services.map((s: ServiceItem) => `
      <div class="service-card">
        <div class="service-card-header">
          <div class="service-icon">${catIcon}</div>
          <h3>${esc(s.name)}</h3>
        </div>
        <p>${esc(s.description)}</p>
        ${s.price ? `<span class="service-price">${esc(s.price)}</span>` : ''}
      </div>
      `).join('')}
    </div>
  </div>
</section>
` : ''}

<!-- ═══════════════ CTA ═══════════════ -->
<section class="cta-section">
  <h2>Ready to Experience ${esc(businessName)}?</h2>
  <p>${contactText ? esc(contactText) : `Contact us today and let us serve you.`}</p>
  <a href="#contact" class="btn">${esc(ctaText)}</a>
</section>

<!-- ═══════════════ CONTACT ═══════════════ -->
${hasSections('contact') ? `
<section id="contact">
  <div class="section-inner">
    <div class="text-center">
      <div class="section-label mx-auto">Get in Touch</div>
      <h2 class="section-title mx-auto">Contact Us</h2>
      <p class="section-desc mx-auto">We'd love to hear from you. Reach out today!</p>
    </div>
    <div class="contact-layout">
      <div class="contact-info">
        <div class="contact-item">
          <div class="contact-item-icon">📞</div>
          <div class="contact-item-text">
            <h4>Phone</h4>
            <a href="tel:+234">Call us anytime</a>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-item-icon">📧</div>
          <div class="contact-item-text">
            <h4>Email</h4>
            <a href="mailto:info@${esc(businessName.toLowerCase().replace(/\s+/g, ''))}.com">info@${esc(businessName.toLowerCase().replace(/\s+/g, ''))}.com</a>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-item-icon">📍</div>
          <div class="contact-item-text">
            <h4>Location</h4>
            <p>${esc(businessName)}, Nigeria</p>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-item-icon">📸</div>
          <div class="contact-item-text">
            <h4>Instagram</h4>
            <a href="https://instagram.com" target="_blank" rel="noopener">@${esc(businessName.toLowerCase().replace(/\s+/g, ''))}</a>
          </div>
        </div>
      </div>
      <div class="contact-form">
        <h3>Send a Message</h3>
        <form onsubmit="event.preventDefault(); this.querySelector('.btn').textContent='Message Sent! ✓'; this.querySelector('.btn').style.background='var(--secondary)'">
          <div class="form-group">
            <label>Your Name</label>
            <input type="text" placeholder="Enter your name" required>
          </div>
          <div class="form-group">
            <label>Email / Phone</label>
            <input type="text" placeholder="How can we reach you?" required>
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea placeholder="Tell us what you need..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">${esc(ctaText)}</button>
        </form>
      </div>
    </div>
  </div>
</section>
` : ''}

<!-- ═══════════════ FOOTER ═══════════════ -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-brand">${catIcon} ${esc(businessName)}</div>
        <p class="footer-brand-desc">Professional ${esc(category.toLowerCase())} services. Serving the community with pride and excellence.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <ul>
          ${hasSections('about') ? '<li><a href="#about">About</a></li>' : ''}
          ${services.length > 0 ? '<li><a href="#services">Services</a></li>' : ''}
          ${hasSections('contact') ? '<li><a href="#contact">Contact</a></li>' : ''}
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:+234">📞 Phone</a></li>
          <li><a href="mailto:info@${esc(businessName.toLowerCase().replace(/\s+/g, ''))}.com">📧 Email</a></li>
          <li><a href="https://instagram.com" target="_blank">📸 Instagram</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; ${year} ${esc(businessName)}. All rights reserved.</span>
      <span>Powered by LeadGen OS</span>
    </div>
  </div>
</footer>

<!-- ═══════════════ SCRIPTS ═══════════════ -->
<script>
// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile nav toggle
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => links.classList.toggle('open'));

// Close mobile nav on link click
links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => links.classList.remove('open'));
});

// Smooth reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .stat-card, .contact-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
</script>

</body>
</html>`

  return html
}
