import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { generateHTML } from "@/lib/html-generator"

/**
 * POST /api/projects/deploy
 * Body: { project_id: string }
 *
 * Loads the project's spec_html (or regenerates from spec),
 * creates a GitHub repo, pushes HTML to GitHub Pages,
 * and returns the live URL.
 */
export async function POST(request: NextRequest) {
  const { project_id } = await request.json()

  if (!project_id) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 1. Load project
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project_id)
    .single()

  if (projErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // 2. Get HTML content — either from spec_html or regenerate from spec
  let htmlContent = project.spec_html as string | null

  if (!htmlContent && project.spec_id) {
    // Regenerate from spec
    const { data: spec } = await supabase
      .from("specs")
      .select("*")
      .eq("id", project.spec_id)
      .single()

    if (spec) {
      htmlContent = generateHTML(
        {
          site_type: spec.site_type,
          pages: spec.pages,
          color_palette: spec.color_palette,
          content: spec.content,
          tech_stack: spec.tech_stack,
        },
        project.business_name,
        project.category || ""
      )

      // Cache it for future deploys
      await supabase
        .from("projects")
        .update({ spec_html: htmlContent })
        .eq("id", project_id)
    }
  }

  if (!htmlContent) {
    return NextResponse.json(
      { error: "No HTML content available. Run the Dev agent first." },
      { status: 400 }
    )
  }

  // 3. Build repo slug: leadgen-client-{slug}
  const slug = project.business_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
  const repoName = `leadgen-client-${slug}`
  const githubToken = process.env.GITHUB_TOKEN || ""

  if (!githubToken) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN not configured" },
      { status: 500 }
    )
  }

  try {
    // 4. Check if repo exists, create if not
    const repoUrl = `https://api.github.com/repos/Starlight480/${repoName}`
    let repoExists = false

    const checkRes = await fetch(repoUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "leadgen-os",
      },
    })
    repoExists = checkRes.ok

    if (!repoExists) {
      // Create the repo
      const createRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "leadgen-os",
        },
        body: JSON.stringify({
          name: repoName,
          description: `LeadGen OS — ${project.business_name}`,
          auto_init: true,
          homepage: `https://starlight480.github.io/${repoName}/`,
          visibility: "public",
        }),
      })

      if (!createRes.ok) {
        const errBody = await createRes.text()
        throw new Error(`Failed to create repo: ${createRes.status} ${errBody}`)
      }

      // Wait a moment for GitHub to initialize the repo
      await new Promise((r) => setTimeout(r, 2000))
    }

    // 5. Write index.html to the repo via GitHub API
    // Get the default branch
    const repoInfoRes = await fetch(repoUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "leadgen-os",
      },
    })
    const repoInfo = await repoInfoRes.json()
    const defaultBranch = repoInfo.default_branch || "main"

    // Check if index.html exists on that branch
    const fileUrl = `https://api.github.com/repos/Starlight480/${repoName}/contents/index.html`
    const fileCheckRes = await fetch(`${fileUrl}?ref=${defaultBranch}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "leadgen-os",
      },
    })

    let sha: string | undefined
    if (fileCheckRes.ok) {
      const fileData = await fileCheckRes.json()
      sha = fileData.sha
    }

    // Create or update index.html
    const body: Record<string, unknown> = {
      message: `Deploy: ${project.business_name} — ${new Date().toISOString()}`,
      content: Buffer.from(htmlContent).toString("base64"),
      branch: defaultBranch,
    }
    if (sha) body.sha = sha

    const putRes = await fetch(fileUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "leadgen-os",
      },
      body: JSON.stringify(body),
    })

    if (!putRes.ok) {
      const errBody = await putRes.text()
      throw new Error(`Failed to push HTML: ${putRes.status} ${errBody}`)
    }

    // 6. Enable GitHub Pages (repo must exist with content)
    const pagesUrl = `https://api.github.com/repos/Starlight480/${repoName}/pages`
    const pagesRes = await fetch(pagesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "leadgen-os",
      },
      body: JSON.stringify({
        source: {
          branch: defaultBranch,
          path: "/",
        },
      }),
    })

    // 422 means pages already enabled — that's fine
    if (!pagesRes.ok && pagesRes.status !== 422) {
      // Pages might need a moment; not fatal
      console.warn("GitHub Pages enable returned:", pagesRes.status)
    }

    // 7. Build the live URL
    const liveUrl = `https://starlight480.github.io/${repoName}/`
    const repoGitUrl = `https://github.com/Starlight480/${repoName}.git`

    // 8. Update project in Supabase
    const now = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from("projects")
      .update({
        deployed: true,
        deploy_url: liveUrl,
        deployed_at: now,
        live_url: liveUrl,
        repo_url: repoGitUrl,
        spec_html: htmlContent,
        updated_at: now,
      })
      .eq("id", project_id)

    if (updateErr) {
      console.error("Failed to update project:", updateErr)
    }

    return NextResponse.json({
      success: true,
      deploy_url: liveUrl,
      repo_url: repoGitUrl,
      repo_name: repoName,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Deploy failed:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
