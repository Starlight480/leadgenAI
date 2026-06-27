import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

// ─── Helpers ───

function normalizePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, "")
  if (cleaned.startsWith("+234")) return cleaned
  if (cleaned.startsWith("0") && cleaned.length >= 11) return "+234" + cleaned.slice(1)
  if (/^[789]\d{9}$/.test(cleaned)) return "+234" + cleaned
  return null
}

function extractPhones(text: string): string[] {
  const matches = text.match(/(?:\+234|0)[789][01]\d{8}/g) || []
  return matches.map(normalizePhone).filter(Boolean) as string[]
}

function extractInstagram(text: string): string | null {
  // Match instagram.com/username or @username (but not @mentions that are clearly not IG)
  const urlMatch = text.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
  if (urlMatch) return `@${urlMatch[1]}`
  // Only match @handles that look like IG (alphanumeric, underscores, dots)
  const handleMatch = text.match(/@([a-zA-Z0-9_.]{3,30})\b/)
  return handleMatch ? `@${handleMatch[1]}` : null
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : null
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
  url?: string
}

interface Candidate {
  business_name: string
  instagram: string | null
  phone: string | null
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
  const combined = `${title} ${content}`

  // Try to get business name from title
  let businessName = cleanBusinessName(title)
  if (!businessName) return null

  // Extract contact info from content
  const phones = extractPhones(combined)
  const instagram = extractInstagram(combined)
  const email = extractEmail(combined)

  // Check if this business has a website
  // If the URL is the business's own site (not a directory listing), it has a website
  const isDirectory = /yelp|tripadvisor|google\.com|facebook\.com|instagram\.com|linktr\.ee|wanderboat|openrice|zomato|eatout/i.test(url)
  const hasOwnWebsite = !isDirectory && (
    url.includes(".com") || url.includes(".ng") || url.includes(".co")
  )

  return {
    business_name: businessName,
    instagram,
    phone: phones[0] || null,
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
      include_raw_content: false,
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
    const leadsToInsert = candidates
      .filter(c => !c.has_website)
      .filter(c => c.phone || c.email || c.instagram)
      .filter((c, i, arr) => {
        const key = c.business_name.toLowerCase().replace(/[^a-z0-9]/g, "")
        return arr.findIndex(a => a.business_name.toLowerCase().replace(/[^a-z0-9]/g, "") === key) === i
      })
      .slice(0, campaign.target_count || 20)

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
