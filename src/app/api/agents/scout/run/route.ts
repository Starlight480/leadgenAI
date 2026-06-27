import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { callLLM, type LLMMessage } from "@/lib/llm"

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

// ─── Helpers ───

function normalizePhone(phone: string): string | null {
  // Strip everything except digits and leading +
  let cleaned = phone.replace(/[^\d+]/g, "")
  // Handle +234(0)801... pattern: +234 followed by 0 then 10 digits
  if (cleaned.startsWith("+2340") && cleaned.length >= 15) {
    cleaned = "+234" + cleaned.slice(5) // remove the extra 0
  }
  if (cleaned.startsWith("+234")) {
    if (cleaned.length === 14) return cleaned // +234 + 10 digits
    // Maybe there were extra digits we stripped; just return if length is right
    return cleaned.length >= 14 ? cleaned.slice(0, 14) : null
  }
  // If it starts with 234 (no +), treat as +234
  if (cleaned.startsWith("234") && cleaned.length === 13) {
    return "+" + cleaned
  }
  // If it starts with 0, it's local format: 0XXXXXXXXXX (11 digits)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return "+234" + cleaned.slice(1)
  }
  // If it's 10 digits starting with 7, 8, or 9
  if (/^[789]\d{9}$/.test(cleaned)) {
    return "+234" + cleaned
  }
  return null
}

function extractPhones(text: string): string[] {
  // Match phone numbers with flexible formatting:
  // +234 XXX XXX XXXX, 0801-234-5678, (0801) 234 5678, 2348012345678, etc.
  // Strategy: find digit sequences that look like Nigerian phone numbers
  const phonePattern = /(?:\+?\s*234\s*\(?\s*0?\s*\)?\s*|\b0)[789]\d[\s\-().]*\d[\s\-().]*\d[\s\-().]*\d[\s\-().]*\d[\s\-().]*\d[\s\-().]*\d[\s\-()]*\d/g
  const loosePattern = /\+?234[789]\d{8,9}/g

  const matches = new Set<string>()

  // First pass: structured matches with separators
  for (const m of text.match(phonePattern) || []) {
    const norm = normalizePhone(m)
    if (norm) matches.add(norm)
  }

  // Second pass: compact numbers like 08012345678 or +2348012345678
  for (const m of text.match(loosePattern) || []) {
    const norm = normalizePhone(m)
    if (norm) matches.add(norm)
  }

  return Array.from(matches)
}

function extractWhatsApp(text: string): string | null {
  // Look for WhatsApp-specific contact info
  // Strategy: find 'whatsapp', 'wa', 'chat' near a phone number
  const waPatterns = [
    /whatsapp[\s:.\-]*(?:call|chat|message|us|number|link)?[\s:.\-]*(\+?[\d\s\-().]{10,20})/gi,
    /(?:call|chat|message|reach)\s+on\s+whatsapp[\s:.\-]*(\+?[\d\s\-().]{10,20})/gi,
    /wa[\s:.\-]*(\+?[\d\s\-().]{10,20})/gi,
    /(\+?[\d\s\-().]{10,20})[\s\-]*(?:whatsapp|wa\b)/gi,
  ]

  for (const pattern of waPatterns) {
    const match = pattern.exec(text)
    if (match) {
      const phone = normalizePhone(match[1])
      if (phone) return phone
    }
  }

  // Also check for wa.me links
  const waMeMatch = text.match(/wa\.me\/(\d{10,15})/i)
  if (waMeMatch) {
    const phone = normalizePhone("+" + waMeMatch[1])
    if (phone) return phone
  }

  return null
}

function extractInstagram(text: string): string | null {
  const urlMatch = text.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
  if (urlMatch) {
    const handle = `@${urlMatch[1]}`
    // Filter out non-handles
    if (handle.includes('.com') || handle.includes('.org') || handle.length < 3) return null
    return handle
  }
  // Match @handles — but prefer ones near 'instagram' context
  const igContextMatch = text.match(/instagram[\s:.\\-]*@([a-zA-Z0-9_.]{3,30})\b/i)
  if (igContextMatch) {
    const handle = `@${igContextMatch[1]}`
    if (handle.includes('.com') || handle.length < 3) return null
    return handle
  }
  // Fallback: generic @handle
  const handleMatch = text.match(/@([a-zA-Z0-9_.]{3,30})\b/)
  if (handleMatch) {
    const handle = `@${handleMatch[1]}`
    if (handle.includes('.com') || handle.length < 3) return null
    return handle
  }
  return null
}

function extractEmail(text: string, sourceUrl: string): { email: string | null; verified: boolean } {
  // Skip common non-business emails
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (!match) return { email: null, verified: false }
  const email = match[0].toLowerCase()
  // Filter out common junk/placeholder emails
  if (email.includes("example.com") || email.includes("test.com") || email.includes("sentry.io")) return { email: null, verified: false }
  if (email.includes("noreply") || email.includes("no-reply") || email.includes("donotreply")) return { email: null, verified: false }
  
  // Email is "verified" only if it comes from the business's own website
  // (not from directory listings, social media, or search snippets)
  const isOwnWebsite = !/yelp|tripadvisor|google\.com|facebook\.com|instagram\.com|linktr\.ee|wanderboat|openrice|zomato|eatout|foursquare|yellowpages|opendi|twitter\.com|x\.com/i.test(sourceUrl)
    && (sourceUrl.includes('.com') || sourceUrl.includes('.ng') || sourceUrl.includes('.co') || sourceUrl.includes('.org'))
  
  return { email, verified: isOwnWebsite }
}

// Clean a business name extracted from search results
function cleanBusinessName(raw: string): string | null {
  let name = raw.trim()

  // === INSTAGRAM / FACEBOOK / SOCIAL PLATFORM JUNK ===
  // Remove "- Instagram", "| Instagram", "· Instagram", "(photos and videos)" etc
  name = name.replace(/\s*[-|·•]\s*Instagram\s*(photos?\s*and\s*videos?)?$/i, "")
  name = name.replace(/\s*[-|·•]\s*Facebook\s*(page|profile|photos?)?$/i, "")
  name = name.replace(/\s*[-|·•]\s*TikTok\s*(video|profile)?$/i, "")
  name = name.replace(/\s*[-|·•]\s*Twitter\s*(profile)?$/i, "")
  name = name.replace(/\s*[-|·•]\s*YouTube\s*(channel)?$/i, "")
  name = name.replace(/\s*[-|·•]\s*LinkedIn\s*(profile|company)?$/i, "")
  name = name.replace(/\s*[-|·•]\s*Linktr\.?ee.*$/i, "")
  name = name.replace(/\s*[-|·•]\s*Yelp.*$/i, "")
  name = name.replace(/\s*[-|·•]\s*Tripadvisor.*$/i, "")
  name = name.replace(/\s*[-|·•]\s*Google\s*Maps.*$/i, "")
  name = name.replace(/\s*[-|·•]\s*Wanderboat.*$/i, "")
  name = name.replace(/\s*[-|·•]\s*Pinterest.*$/i, "")

  // Remove IG handle from name: "Business Name (@handle)" → "Business Name"
  name = name.replace(/\s*\(?!.*\)\s*@[\w.]+\s*\)/g, "")  // don't touch valid parens
  name = name.replace(/\s*\(@[\w.]+\)/g, "")
  name = name.replace(/\s*@\([\w.]+\)/g, "")

  // Remove "· Location" suffix from social platforms: "Business · Lagos"
  name = name.replace(/\s*·\s*(Lagos|Abuja|Nigeria|Ajah|Lekki|V\.?I\.?|Victoria Island|Port Harcourt|Ikeja).*$/i, "")

  // === COMMON PAGE TITLE JUNK ===
  name = name.replace(/\s*[\|–—-]\s*(Home\s*Page|Official\s*Site|Website|Contact\s*Us|Opening\s*Hours|Phone\s*Number|Address|Map|Directions|Reviews|Menu|Book\s*Now|Order\s*Online|Reservations?).*$/i, "")
  name = name.replace(/^(Home\s*Page|Official\s*Site)\s*[\|–—-]\s*/i, "")

  // === TRAILING LOCATION/REVIEW JUNK ===
  name = name.replace(/\s*[-–—]\s*(Lagos|Nigeria|Abuja|Port Harcourt|Ajah|Lekki|Victoria Island).*$/i, "")
  name = name.replace(/\s*\(\d+\+?\s*reviews?\).*$/i, "")
  name = name.replace(/\s*\d+\.?\d*\s*stars?.*$/i, "")
  name = name.replace(/\s*·\s*\d+\+?\s*reviews?.*$/i, "")

  // === LEADING JUNK ===
  name = name.replace(/^(Top\s+\d+|Best\s+\d+|List\s+of|All\s+\d+)\s+.*$/i, "")
  name = name.replace(/^(Home\s*Page|Official\s*Website|Contact)\s*.*$/i, "")
  name = name.replace(/^\d+\s*[-–—]\s*/i, "")  // "10 - Best Salons..." → "Best Salons..."

  // === CLEARLY NOT BUSINESS NAMES ===
  if (/^(Top|Best|List|How|What|Why|Guide|Review|Find|Where|Compare)/i.test(name)) return null
  if (/^(Home|About|Contact|Menu|Services|FAQ|Blog|News|Careers)/i.test(name)) return null
  if (name.length < 3 || name.length > 60) return null
  if (/^[\d\s]+$/.test(name)) return null
  if (name.toLowerCase() === "instagram" || name.toLowerCase() === "facebook") return null
  if (name.toLowerCase() === "tiktok" || name.toLowerCase() === "twitter") return null
  if (name.includes("cookie") || name.includes("sign in") || name.includes("log in")) return null
  if (name.includes("http") || name.includes("www.")) return null
  if (/^\d+\+?\s*(salon|barber|restaurant|hotel)/i.test(name)) return null  // "10+ Best..."

  // Final trim
  name = name.replace(/^[\s\-–—·|]+/, "").replace(/[\s\-–—·|]+$/, "")

  if (name.length < 3) return null
  return name
}

// Detect the actual business category from name and content
function detectCategory(name: string, content: string, campaignCategory: string): string {
  const combined = `${name} ${content}`.toLowerCase()

  // Barbershop keywords
  if (/\b(barber|barbershop|barbing|haircut|fade|lineup|clipper|taper)\b/i.test(combined))
    return "barbershop"

  // Salon keywords (hair/beauty, NOT barbers)
  if (/\b(salon|hairdress|hairstylist|braids?|twist|locs?|weave|wig|nail|pedicure|manicure|facial|beauty\s*spa|nail\s*spa|beauty\s*bar|cosmetic|esthetic|makeup|lash|brow)\b/i.test(combined))
    return "salon"

  // Restaurant keywords
  if (/\b(restaurant|cafe|kitchen|grill|bar\b|lounge|bistro|diner|food|eatery|chops|canteen|bakery|patisserie|ice\s*cream|shisha|cocktail|brunch)\b/i.test(combined))
    return "restaurant"

  // Hotel keywords
  if (/\b(hotel|motel|inn|resort|lodge|guest\s*house|hostel|airbnb|shortlet|apartment\s*hotel)\b/i.test(combined))
    return "hotel"

  // Pharmacy keywords
  if (/\b(pharmacy|pharmacies|chemist|drugstore|medical|clinic|hospital|health)\b/i.test(combined))
    return "pharmacy"

  // Church/religious keywords
  if (/\b(church|mosque|temple|cathedral|parish|ministry|worship|congregation)\b/i.test(combined))
    return "church"

  // Supermarket/retail keywords
  if (/\b(supermarket|grocery|store|shop|market|mart|retail|boutique|fashion)\b/i.test(combined))
    return "supermarket"

  // Gym/fitness keywords
  if (/\b(gym|fitness|crossfit|yoga|wellness|spa\b|massage)\b/i.test(combined))
    return "salon"  // group with salon as "beauty/wellness"

  // Default: use campaign category
  return campaignCategory
}

interface TavilyResult {
  title?: string
  content?: string
  raw_content?: string
  url?: string
}

interface Candidate {
  business_name: string
  category: string
  instagram: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  email_verified: boolean
  address: string | null
  has_website: boolean
  source_url: string
  raw_content: string
}

// Extract a single business candidate from a Tavily result
function extractCandidate(result: TavilyResult, area: string, city: string): Candidate | null {
  const title = result.title || ""
  const content = result.content || ""
  const url = result.url || ""
  // Use raw_content if available (full page text), fall back to content snippet
  const rawContent = result.raw_content || ""
  const combined = `${title} ${content} ${rawContent}`

  // Try to get business name from title
  let businessName = cleanBusinessName(title)
  if (!businessName) return null

  // Extract contact info from content
  const phones = extractPhones(combined)
  const whatsapp = extractWhatsApp(combined)
  const instagram = extractInstagram(combined)
  const { email, verified: emailVerified } = extractEmail(combined, url)

  // Prefer WhatsApp number, fall back to extracted phone
  const primaryPhone = whatsapp || phones[0] || null


  // Check if this business has its own website
  // If the URL is from a directory/social platform, the business probably doesn't have its own site
  const isDirectory = /yelp|tripadvisor|google\.com|facebook\.com|instagram\.com|linktr\.ee|wanderboat|openrice|zomato|eatout|foursquare|justdial|yellowpages|opendi|showmore|eatoutco|whatsapp\.com|twitter\.com|x\.com/i.test(url)
  // Also flag Wikipedia, Quora, Reddit, Medium, blog posts about the business
  const isArticle = /wikipedia|quora|reddit|medium\.com|substack|blogspot|wordpress\.com/i.test(url)
  const hasOwnWebsite = !isDirectory && !isArticle && (
    url.includes(".com") || url.includes(".ng") || url.includes(".co") || url.includes(".org")
  )

  return {
    business_name: businessName,
    category: "",  // will be set at insert time
    instagram,
    phone: primaryPhone,
    whatsapp,
    email,
    email_verified: emailVerified,
    address: area ? `${area}, ${city}` : city,
    has_website: hasOwnWebsite,
    source_url: url,
    raw_content: rawContent.substring(0, 500),
  }
}

// ─── LLM Candidate Filtering ───

interface FilterResult {
  index: number
  keep: boolean
  clean_name: string
  confidence: number
  reason: string
}

const FILTER_MODEL = "google/gemma-4-31b-it:free"
const BATCH_SIZE = 8 // process candidates in batches to stay within token limits

function buildFilterPrompt(candidates: Candidate[]): LLMMessage[] {
  const candidateList = candidates.map((c, i) => ({
    index: i,
    business_name: c.business_name,
    category: c.category,
    instagram: c.instagram,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    address: c.address,
    has_website: c.has_website,
    source_url: c.source_url,
    snippet: c.raw_content.substring(0, 200),
  }))

  return [
    {
      role: "system",
      content: `You are a lead quality evaluator for a Nigerian business lead generation system.
Your job is to filter out junk candidates and keep only real, contactable businesses.

RULES FOR DISCARDING (keep: false):
- Instagram/Facebook pages with no real business info (just a social profile)
- Directory/listing pages (Yelp, TripAdvisor, Google Maps, YellowPages, etc.)
- Articles, blog posts, news stories, or listicles ("Top 10 salons in Lagos")
- Pages that are about the city/area, not a specific business
- Generic names like "Hair Salon" or "Restaurant" with no distinguishing info
- Businesses with NO contact method at all (no phone, no email, no WhatsApp, no Instagram handle with content)
- Websites that are clearly aggregators or marketplaces

RULES FOR KEEPING (keep: true):
- Real businesses with a name and at least one contact method
- Business Instagram pages that have a real business name (not just "@handle")
- Websites that belong to a specific business

CLEANING RULES:
- Remove "- Instagram", "| Facebook", "(photos and videos)" etc from names
- Remove location suffixes like "- Lagos", "· Abuja"
- Remove trailing junk like "(42 reviews)", "4.5 stars"
- The clean_name should be the business's real name only

CONFIDENCE SCORE (0.0 to 1.0):
- 0.9-1.0: Definitely a real business with good contact info
- 0.7-0.8: Likely a real business, some details missing
- 0.5-0.6: Might be a business, uncertain
- Below 0.5: Probably not a real business lead

You MUST return ONLY a JSON array, no markdown, no explanation outside the JSON.
Format: [{"index": 0, "keep": true, "clean_name": "...", "confidence": 0.9, "reason": "..."}]`,
    },
    {
      role: "user",
      content: `Evaluate these ${candidates.length} candidates and return the JSON array.\n\n${JSON.stringify(candidateList, null, 2)}`,
    },
  ]
}

async function filterBatch(candidates: Candidate[]): Promise<FilterResult[]> {
  const messages = buildFilterPrompt(candidates)
  const response = await callLLM(messages, FILTER_MODEL, {
    temperature: 0.1,
    max_tokens: 4096,
  })

  // Parse the JSON response — handle markdown code blocks if present
  let content = response.content.trim()
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
  }

  const parsed = JSON.parse(content)

  // Validate it's an array
  if (!Array.isArray(parsed)) {
    throw new Error("LLM response is not an array")
  }

  return parsed as FilterResult[]
}

async function filterCandidatesWithLLM(candidates: Candidate[]): Promise<Candidate[]> {
  if (candidates.length === 0) return candidates

  const allResults: FilterResult[] = []

  // Process in batches
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    const batchResults = await filterBatch(batch)
    allResults.push(...batchResults)
  }

  // Build a map of index → filter result
  const resultMap = new Map<number, FilterResult>()
  for (const result of allResults) {
    resultMap.set(result.index, result)
  }

  // Filter and clean candidates
  const filtered: Candidate[] = []
  for (let i = 0; i < candidates.length; i++) {
    const result = resultMap.get(i)
    if (!result) continue // no result = discard

    if (result.keep && result.confidence >= 0.5) {
      // Apply the cleaned name from the LLM
      const cleanedCandidate = { ...candidates[i] }
      if (result.clean_name && result.clean_name.length >= 3) {
        cleanedCandidate.business_name = result.clean_name
      }
      filtered.push(cleanedCandidate)
    }
  }

  return filtered
}

// ─── Tavily Search ───

async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      max_results: 10,
      include_raw_content: true,
    }),
  })
  const data = await res.json()
  return data.results || []
}

// ─── Main Handler ───

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()
  const { campaign_id } = body

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 })
  }

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: "TAVILY_API_KEY not configured" }, { status: 500 })
  }

  // Load campaign
  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single()

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  const category = campaign.category || "businesses"
  const area = campaign.area || ""
  const city = campaign.city || "Lagos"

  // Multiple search queries to maximize coverage
  const queries = [
    `${category} ${area} ${city} Nigeria phone number`,
    `${category} near ${area} ${city} instagram`,
    `best ${category} ${area} ${city} contact`,
    `${category} ${area} ${city} whatsapp contact`,
    `${category} ${area} ${city} no website`,
  ]

  try {
    // Run all searches in parallel
    const searchResults = await Promise.all(queries.map(q => tavilySearch(q)))
    const allResults = searchResults.flat()


    // Deduplicate by URL
    const seen = new Set<string>()
    const uniqueResults = allResults.filter(r => {
      const url = r.url || ""
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })

    // Extract candidates from structured results
    const candidates: Candidate[] = []
    for (const result of uniqueResults) {
      const candidate = extractCandidate(result, area, city)
      if (candidate) candidates.push(candidate)
    }


    // Filter: no website, has at least one contact method, deduplicate by name
    const noWebsite = candidates.filter(c => !c.has_website)

    const withContact = noWebsite.filter(c => c.phone || c.email || c.instagram || c.whatsapp)

    const leadsToInsert = noWebsite
      .filter(c => c.phone || c.email || c.instagram || c.whatsapp)
      .filter((c, i, arr) => {
        // Fuzzy dedup: normalize name by removing all non-alphanumeric, lowercasing
        const nameKey = c.business_name.toLowerCase().replace(/[^a-z0-9]/g, "")
        const nameMatch = arr.findIndex(a =>
          a.business_name.toLowerCase().replace(/[^a-z0-9]/g, "") === nameKey
        ) === i
        // Also dedup by phone: same number = same business
        if (c.phone) {
          const phoneMatch = arr.findIndex(a =>
            a.phone && a.phone === c.phone
          ) === i
          return nameMatch || phoneMatch // keep if either is unique (prefer phone dedup for cross-name dupes)
        }
        return nameMatch
      })
      .slice(0, campaign.target_count || 20)

    // LLM filtering: validate candidates and clean business names
    let filteredLeads = leadsToInsert
    try {
      const beforeCount = leadsToInsert.length
      filteredLeads = await filterCandidatesWithLLM(leadsToInsert)
      console.log(`LLM filter: ${beforeCount} candidates → ${filteredLeads.length} kept`)
    } catch (llmError) {
      // If LLM filtering fails, fall back to unfiltered candidates
      console.warn("LLM filtering failed, using unfiltered candidates:", llmError)
      filteredLeads = leadsToInsert
    }

    // Check for existing leads before inserting
    const newLeads: Array<Record<string, unknown>> = []
    for (const lead of filteredLeads) {
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .ilike("business_name", lead.business_name)
        .limit(1)

      if (!existing || existing.length === 0) {
        const detectedCat = detectCategory(lead.business_name, lead.raw_content, category)
        newLeads.push({
          business_name: lead.business_name,
          category: detectedCat,
          city,
          area: area || null,
          address: lead.address,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          email: lead.email,
          email_verified: lead.email_verified,
          instagram: lead.instagram,
          has_website: false,
          source: "scout",
          status: "new",
          priority: "normal",
          lead_type: "website_build",
          pipeline_stage: "discovered",
          campaign_id,
        })
      }
    }

    // Insert leads
    let leadsFound = 0
    if (newLeads.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from("leads")
        .insert(newLeads)
        .select("id")

      if (insertErr) throw insertErr
      leadsFound = inserted?.length || 0
    }

    // Update campaign
    await supabase
      .from("campaigns")
      .update({
        leads_found: campaign.leads_found + leadsFound,
        leads_processed: campaign.leads_processed + leadsFound,
        search_query: queries[0],
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaign_id)

    // Log event
    await supabase.from("pipeline_events").insert({
      campaign_id,
      agent: "scout",
      event_type: "scout_completed",
      summary: `Scout found ${leadsFound} businesses for "${category} in ${area || city}"`,
      details: {
        queries_run: queries.length,
        total_results: uniqueResults.length,
        candidates_found: candidates.length,
        with_contact: candidates.filter(c => c.phone || c.email || c.instagram).length,
        llm_filtered_count: filteredLeads.length,
        leads_inserted: leadsFound,
      },
      success: true,
    })

    return NextResponse.json({
      leads_found: leadsFound,
      candidates_scanned: candidates.length,
      queries_run: queries.length,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)

    await supabase
      .from("campaigns")
      .update({ status: "failed", error: errMsg })
      .eq("id", campaign_id)

    await supabase.from("pipeline_events").insert({
      campaign_id,
      agent: "scout",
      event_type: "scout_failed",
      summary: `Scout failed: ${errMsg}`,
      success: false,
      error: errMsg,
    })

    console.error("SCOUT ERROR:", errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
