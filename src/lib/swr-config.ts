// Shared SWR configuration for all pages
// Used by: leads, dashboard, campaigns, pipeline, invoices, outreach, projects

export const swrConfig = {
  // Deduplicate identical requests within 5s
  dedupingInterval: 5000,
  // Don't re-fetch on window focus for stable pages
  revalidateOnFocus: true,
  // Re-fetch on reconnect (e.g. switching WiFi)
  revalidateOnReconnect: true,
  // Retry failed requests 3 times with exponential backoff
  errorRetryCount: 3,
  // Keep previous data while revalidating (no flash)
  keepPreviousData: true,
};

// Per-page refresh intervals (ms)
// Faster = more real-time, higher Supabase load
export const refreshIntervals = {
  dashboard: 15000,    // 15s — stats update frequently
  leads: 20000,        // 20s — leads change on Scout runs
  campaigns: 15000,    // 15s — campaign progress
  pipeline: 10000,     // 10s — real-time pipeline events
  projects: 30000,     // 30s — project status changes less often
  invoices: 30000,     // 30s — invoices are stable
  outreach: 15000,     // 15s — outreach status updates
  followups: 60000,    // 60s — follow-ups check daily
};
