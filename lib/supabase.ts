// Supabase client — wired up but NOT used yet in the demo.
// The dashboard currently runs on synthetic data (see lib/mock_data_generator.ts).
// When you're ready to connect real auth + persistence:
//   1. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
//   2. Run the schema in supabase/schema.sql
//   3. Swap generateHerd() calls for queries against this client.
//
// This file is safe to import even without env vars set; it only throws if you
// actually call createClient() at runtime without configuration.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. " +
      "The demo runs on synthetic data and does not require this."
    );
  }
  return createBrowserClient(url, key);
}
