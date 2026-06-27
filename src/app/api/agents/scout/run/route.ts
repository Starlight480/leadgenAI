import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

// Phone number normalization for Nigerian numbers
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-()]/g, "")
  if (cleaned.startsWith("+234")) return cleaned
  if (cleaned.startsWith("0") && cleaned.length >= 11) return "+234" + cleaned.slice(1)
  if (/^[789]\d{9}$/.test(cleaned)) return "+234" + cleaned
  return cleaned
}

// Extract Instagram handle from text
function extractInstagram(text: string): string | null {
  const match = text.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i) || text.match(/@([a-zA-Z0-9_.]+)/)
  return match ? `@${match[1]}` : null
}

// Extract phone from text
function extractPhone(text: string): string | null {
  const match = text.match(/(?:\+234|0)[789][01]\d{8}/)
  return match ? normalizePhone(match[0]) : null
}

// Extract email from text
function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : null
}

async function tavilySearch(query: string): Promise<string> {
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
  if (!data.results) return ""
  return data.results
    .map((r: { title?: string; content?: string; url?: string }) =>
      [r.title, r.content, r.url].filter(Boolean).join(" ")
    )
    .join("\n")
}

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
  const query = campaign.search_query || `${category} in ${area} ${city} Nigeria no website`

  try {
    // Step 1: Search for businesses
    const searchResults = await tavilySearch(query)

    // Step 2: Search for businesses without websites specifically
    const noWebsiteResults = await tavilySearch(`${category} ${area} ${city} Instagram handle -site:*.com -site:*.ng`)

    const combinedText = searchResults + "\n" + noWebsiteResults

    // Step 3: Extract business names and contact info from search results
    const lines = combinedText.split("\n").filter((l) => l.trim().length > 10)
    const candidates: Array<{
      business_name: string
      instagram: string | null
      phone: string | null
      email: string | null
      address: string | null
      has_website: boolean
    }> = []

    for (const line of lines) {
      const instagram = extractInstagram(line)
      const phone = extractPhone(line)
      const email = extractEmail(line)

      // Try to extract business name from the line
      const nameMatch = line.match(/^([A-Z][^.!?\n]{5,50})/) || line.match(/\*\*([^*]+)\*\*/)
      const businessName = nameMatch ? nameMatch[1].trim() : null

      if (!businessName || businessName.length < 3) continue

      // Skip if it looks like a website URL or navigation
      if (businessName.toLowerCase().includes("sign in") || businessName.toLowerCase().includes("log in")) continue
      if (businessName.toLowerCase().includes("cookie")) continue

      // Check if this business likely has a website
      const hasWebsite =
        line.includes(".com") ||
        line.includes(".ng") ||
        line.includes("website") ||
        line.includes("visit us")

      candidates.push({
        business_name: businessName,
        instagram,
        phone: phone ? normalizePhone(phone) : null,
        email,
        address: area ? `${area}, ${city}` : city,
        has_website: hasWebsite,
      })
    }

    // Step 4: Filter out businesses with websites and deduplicate
    const leadsToInsert = candidates
      .filter((c) => !c.has_website)
      .filter((c, i, arr) => arr.findIndex((a) => a.business_name.toLowerCase() === c.business_name.toLowerCase()) === i)
      .slice(0, campaign.target_count || 20)

    // Step 5: Check for existing leads before inserting
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

    // Step 6: Insert leads
    let leadsFound = 0
    if (newLeads.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from("leads")
        .insert(newLeads)
        .select("id")

      if (insertErr) throw insertErr
      leadsFound = inserted?.length || 0
    }

    // Step 7: Update campaign
    await supabase
      .from("campaigns")
      .update({
        leads_found: campaign.leads_found + leadsFound,
        leads_processed: campaign.leads_processed + leadsFound,
        search_query: query,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaign_id)

    // Step 8: Log event
    await supabase.from("pipeline_events").insert({
      campaign_id,
      agent: "scout",
      event_type: "scout_completed",
      summary: `Scout found ${leadsFound} businesses without websites for "${query}"`,
      details: {
        query,
        candidates_found: candidates.length,
        with_website: candidates.filter((c) => c.has_website).length,
        leads_inserted: leadsFound,
      },
      success: true,
    })

    return NextResponse.json({
      leads_found: leadsFound,
      candidates_scanned: candidates.length,
      query,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error)

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
