import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || ""

function verifyWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!secret) return true // Skip verification if no secret configured (dev mode)
  if (!signatureHeader) return false

  try {
    const [timestampPart, signaturesPart] = signatureHeader.split(",", 2)
    if (!timestampPart || !signaturesPart) return false

    const timestamp = timestampPart.replace("t=", "")
    const signatures = signaturesPart.replace("signatures=", "").split(" ")

    // Create the signed content
    const signedContent = `${timestamp}.${payload}`

    // Verify each signature
    for (const sig of signatures) {
      const [version, hash] = sig.split(",", 2)
      if (version !== "v1" || !hash) continue

      const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(signedContent)
        .digest("hex")

      if (crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"))) {
        return true
      }
    }

    return false
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signatureHeader = request.headers.get("svix-signature")

    // Verify webhook signature
    if (RESEND_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(body, signatureHeader, RESEND_WEBHOOK_SECRET)
      if (!isValid) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const { type, data } = event

    const supabase = getSupabaseAdmin()

    // Handle different event types
    switch (type) {
      case "email.delivered": {
        const emailId = data?.email_id
        if (!emailId) break

        // Update outreach item status
        const { data: outreach } = await supabase
          .from("outreach")
          .select("id, lead_id")
          .eq("resend_id", emailId)
          .single()

        if (outreach) {
          await supabase
            .from("outreach")
            .update({ status: "delivered" })
            .eq("id", outreach.id)

          await supabase.from("pipeline_events").insert({
            lead_id: outreach.lead_id,
            agent: "reach",
            event_type: "email_delivered",
            summary: `Email delivered to ${data?.to?.[0] || "recipient"}`,
            details: { email_id: emailId, to: data?.to },
            success: true,
          })
        }
        break
      }

      case "email.bounced": {
        const emailId = data?.email_id
        if (!emailId) break

        const { data: outreach } = await supabase
          .from("outreach")
          .select("id, lead_id")
          .eq("resend_id", emailId)
          .single()

        if (outreach) {
          await supabase
            .from("outreach")
            .update({ status: "failed", manual_reason: `Bounced: ${data?.bounce_type || "unknown"}` })
            .eq("id", outreach.id)

          await supabase.from("pipeline_events").insert({
            lead_id: outreach.lead_id,
            agent: "reach",
            event_type: "email_bounced",
            summary: `Email bounced: ${data?.bounce_type || "unknown"}`,
            details: { email_id: emailId, bounce_type: data?.bounce_type, to: data?.to },
            success: false,
          })
        }
        break
      }

      case "email.complained": {
        const emailId = data?.email_id
        if (!emailId) break

        const { data: outreach } = await supabase
          .from("outreach")
          .select("id, lead_id")
          .eq("resend_id", emailId)
          .single()

        if (outreach) {
          await supabase
            .from("outreach")
            .update({ status: "complained" })
            .eq("id", outreach.id)

          // Mark lead as dead if they complained
          if (outreach.lead_id) {
            await supabase
              .from("leads")
              .update({ status: "dead" })
              .eq("id", outreach.lead_id)
          }

          await supabase.from("pipeline_events").insert({
            lead_id: outreach.lead_id,
            agent: "reach",
            event_type: "email_complained",
            summary: `Email complained (spam report): ${data?.to?.[0] || "unknown"}`,
            details: { email_id: emailId, to: data?.to },
            success: false,
          })
        }
        break
      }

      default:
        // Log unhandled event types for debugging
        console.log(`Unhandled Resend webhook event: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
