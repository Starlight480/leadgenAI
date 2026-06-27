import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

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
  if (urlMatch) return `@${urlMatch[1]}`
  // Match @handles — but prefer ones near 'instagram' context
  const igContextMatch = text.match(/instagram[\s:.\-]*@([a-zA-Z0-9_.]{3,30})\b/i)
  if (igContextMatch) return `@${igContextMatch[1]}`
  // Fallback: generic @handle
  const handleMatch = text.match(/@([a-zA-Z0-9_.]{3,30})\b/)
  return handleMatch ? `@${handleMatch[1]}` : null
}

function extractEmail(text: string): string | null {
  // Skip common non-business emails
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (!match) return null
  const email = match[0].toLowerCase()
  // Filter out common junk/placeholder emails
  if (email.includes("example.com") || email.includes("test.com") || email.includes("sentry.io")) return null
  if (email.includes("noreply") || email.includes("no-reply") || email.includes("donotreply")) return null
  return email
}

// Clean a business name extracted from search results
function cleanBusinessName(raw: string): string | null {
  let name = raw.trim()

  // Remove common page title junk
  name = name.replace(/\s*[\|–—-]\s*(Home\s*Page|Official\s*Site|Website|Contact\s*Us).*$/i, "")
  name = name.replace(/^(Home\s*Page|Official\s*Site)\s*[\|–—-]\s*/i, "")
  name = name.replace(/\s*[\|–—]\s*Instagram.*$/i, "")
  name = name.replace(/\s*[\|–—]\s*Facebook.*$/i, "")
  name = name.replace(/\s*[\|–—]\s*Linktr.*$/i, "")
  name = name.replace(/\s*[\|–—]\s*Yelp.*$/i, "")
  name = name.replace(/\s*[\|–—]\s*Tripadvisor.*$/i, "")
  name = name.replace(/\s*[\|–—]\s*Google\s*Maps.*$/i, "")
  name = name.replace(/\s*[\|–—]\s*Wanderboat.*$/i, "")

  // Remove trailing junk patterns
  name = name.replace(/\s*[-–—]\s*(Lagos|Nigeria|Abuja|Port Harcourt).*$/i, "")
  name = name.replace(/\s*\(\d+\+?\s*reviews?\).*$/i, "")
  name = name.replace(/\s*\d+\.\d\s*stars?.*$/i, "")

  // Remove leading junk
  name = name.replace(/^(Top\s+\d+|Best\s+\d+|List\s+of)\s+.*$/i, "")
  name = name.replace(/^(Home\s*Page|Official\s*Website|Contact)\s*.*$/i, "")

  // Remove lines that are clearly not business names
  if (/^(Top|Best|List|How|What|Why|Guide|Review)/i.test(name)) return null
  if (/^(Home|About|Contact|Menu|Services|FAQ)/i.test(name)) return null
  if (name.length < 3 || name.length > 60) return null
  if (/^\d+$/.test(name)) return null
  if (name.includes("cookie") || name.includes("sign in") || name.includes("log in")) return null
  if (name.includes("http") || name.includes("www.")) return null

  return name
}

interface TavilyResult {
  title?: string
  content?: string
  raw_content?: string
  url?: string
}

interface Candidate {
  business_name: string
  instagram: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  has_website: boolean
  source_url: string
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
  const email = extractEmail(combined)

  // Prefer WhatsApp number, fall back to extracted phone
  const primaryPhone = whatsapp || phones[0] || null

  console.log(`  [extract] "${businessName}": phones=${phones.length} whatsapp=${whatsapp ? "yes" : "no"} ig=${instagram || "none"} email=${email || "none"}`)

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
    instagram,
    phone: primaryPhone,
    whatsapp,
    email,
    address: area ? `${area}, ${city}` : city,
    has_website: hasOwnWebsite,
    source_url: url,
  }
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

    console.log(`[scout] ${queries.length} queries returned ${allResults.length} total results`)

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

    console.log(`[scout] Extracted ${candidates.length} candidates from ${uniqueResults.length} unique results`)
    console.log(`[scout] With phone: ${candidates.filter(c => c.phone).length}, email: ${candidates.filter(c => c.email).length}, IG: ${candidates.filter(c => c.instagram).length}`)

    // Filter: no website, has at least one contact method, deduplicate by name
    const noWebsite = candidates.filter(c => !c.has_website)
    console.log(`[scout] After has_website filter: ${noWebsite.length} (from ${candidates.length})`)

    const withContact = noWebsite.filter(c => c.phone || c.email || c.instagram || c.whatsapp)
    console.log(`[scout] After contact filter: ${withContact.length} (from ${noWebsite.length})`)
    withContact.forEach(c => console.log(`  - ${c.business_name}: phone=${c.phone} email=${c.email} ig=${c.instagram} wa=${c.whatsapp}`))

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

    console.log(`[scout] ${leadsToInsert.length} leads after dedup and filtering (no website + has contact)`)

    // Check for existing leads before inserting
    const newLeads: Array<Record<string, unknown>> = []
    for (const lead of leadsToInsert) {
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .ilike("business_name", lead.business_name)
        .limit(1)

      if (!existing || existing.length === 0) {
        newLeads.push({
          business_name: lead.business_name,
          category,
          city,
          area: area || null,
          address: lead.address,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          email: lead.email,
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
        leads_inserted: leadsFound,
      },
      success: true,
    })

    return NextResponse.json({
      leads_found: leadsFound,
      candidates_scanned: candidates.length,
      queries_run: queries.length,
      debug: {
        total_results: uniqueResults.length,
        unique_results: uniqueResults.length,
        with_website: candidates.filter(c => c.has_website).length,
        without_website: candidates.filter(c => !c.has_website).length,
        with_phone: candidates.filter(c => c.phone).length,
        with_email: candidates.filter(c => c.email).length,
        with_instagram: candidates.filter(c => c.instagram).length,
        with_whatsapp: candidates.filter(c => c.whatsapp).length,
        with_any_contact: candidates.filter(c => c.phone || c.email || c.instagram).length,
        sample_candidates: candidates.slice(0, 5).map(c => ({
          name: c.business_name,
          has_website: c.has_website,
          phone: c.phone,
          email: c.email,
          instagram: c.instagram,
          source_url: c.source_url?.substring(0, 80),
        })),
      },
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
// redeploy 1782552230
