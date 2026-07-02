import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy server-side client — only created when first called
let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    _admin = createClient(url, key)
  }
  return _admin
}

// Browser client — creates directly in the browser.
// NEXT_PUBLIC_ env vars are available on the client at runtime.
// No Proxy needed — the old Proxy broke chained queries like
// supabase.from("x").select("...") because .from() returned a Promise.
let _browserClient: SupabaseClient | null = null

export function createBrowserClient(): SupabaseClient {
  if (_browserClient) return _browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!url || !key) {
    // Build-time or missing env vars — return a dummy client
    // This prevents build-time crashes when env vars aren't inlined
    return createClient('https://placeholder.supabase.co', 'placeholder') as SupabaseClient
  }

  _browserClient = createClient(url, key)
  return _browserClient
}
