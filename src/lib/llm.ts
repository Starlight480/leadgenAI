// OpenRouter LLM client for Scribe and Dev agents
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export async function callLLM(
  messages: LLMMessage[],
  model: string = 'xiaomi/mimo-v2.5',
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<LLMResponse> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://leadgen-os.vercel.app',
      'X-Title': 'LeadGen OS',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`LLM API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content ?? '',
    usage: data.usage,
  }
}
