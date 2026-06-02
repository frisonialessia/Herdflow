// Browser Supabase client, for use inside Client Components.
//
// Only call this once `isSupabaseConfigured()` is true. It throws otherwise so
// misconfiguration fails loudly instead of silently pointing at nothing — the
// demo never reaches here because auth UI is only rendered when configured.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. The demo runs on " +
        "synthetic data and does not require this."
    );
  }

  return createBrowserClient(url, key);
}
