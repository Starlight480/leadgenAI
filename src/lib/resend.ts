import { Resend } from "resend"

let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error("RESEND_API_KEY not configured")
    resend = new Resend(apiKey)
  }
  return resend
}

interface SendEmailOptions {
  from: string
  to: string
  subject: string
  text: string
  html?: string
  trackOpens?: boolean
  trackClicks?: boolean
}

interface SendEmailResult {
  id: string
  success: boolean
  error?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = getResendClient()

  try {
    const result = await client.emails.send({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, "<br>"),
      headers: {
        // Enable open tracking via Resend
        ...(options.trackOpens ? { "X-Resend-Track": "opens" } : {}),
      },
    })

    return {
      id: result.data?.id || "unknown",
      success: true,
    }
  } catch (error) {
    return {
      id: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
