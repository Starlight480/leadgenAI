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

// Lazy proxy for browser — prevents build-time crashes
let _promise: Promise<SupabaseClient> | null = null

function _getClient(): Promise<SupabaseClient> {
  if (!_promise) {
    _promise = Promise.resolve().then(() => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
      )
    })
  }
  return _promise
}

export function createBrowserClient(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === '__isProxy') return true
      return (...args: unknown[]) => {
        return _getClient().then(c => {
          const fn = (c as unknown as Record<string | symbol, unknown>)[prop]
          if (typeof fn === 'function') return (fn as Function).apply(c, args)
          return fn
        })
      }
    },
  })
}
