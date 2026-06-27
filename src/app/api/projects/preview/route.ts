import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { generateHTML } from "@/lib/html-generator"

/**
 * POST /api/projects/preview
 * Body: { project_id: string, html_content?: string }
 *
 * Returns the HTML content for preview (opened in a new tab via blob URL on client).
 * If html_content is provided, use it directly. Otherwise load from project.
 */
export async function POST(request: NextRequest) {
  const { project_id, html_content } = await request.json()

  if (!project_id) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 })
  }

  let html = html_content as string | null

  if (!html) {
    const supabase = getSupabaseAdmin()

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*, specs!inner(*)")
      .eq("id", project_id)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Try cached spec_html first
    html = project.spec_html as string | null

    if (!html) {
      // Regenerate from spec
      const spec = project.specs as Record<string, unknown> | null
      if (spec) {
        html = generateHTML(
          {
            site_type: spec.site_type,
            pages: spec.pages,
            color_palette: spec.color_palette,
            content: spec.content,
            tech_stack: spec.tech_stack,
          } as Parameters<typeof generateHTML>[0],
          project.business_name,
          project.category || ""
        )

        // Cache it
        await supabase
          .from("projects")
          .update({ spec_html: html })
          .eq("id", project_id)
      }
    }
  }

  if (!html) {
    return NextResponse.json(
      { error: "No HTML content available" },
      { status: 400 }
    )
  }

  return NextResponse.json({ html })
}
