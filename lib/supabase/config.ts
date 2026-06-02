// Single source of truth for whether Supabase is wired up.
//
// When the env vars are ABSENT, HerdFlow runs in "demo mode": the synthetic
// generator drives the dashboard and auth is bypassed, so the public demo keeps
// working with zero configuration (this is what's deployed on Vercel today).
//
// When they're PRESENT, auth + RLS take over (login gate, real sessions).
//
// NEXT_PUBLIC_* vars are inlined into both the server and client bundles, so
// this helper is safe to call from either context.

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
