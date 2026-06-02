# HerdFlow

Predictive livestock health monitoring — detects animal health anomalies
(fever, activity collapse, reduced rumination) **before they're visible to the eye**,
using behavioural telemetry and per-animal z-score baselines.

Built with Next.js 14 (App Router) · TypeScript · Tailwind · Lucide icons.
Backend-ready for Supabase, but the demo runs entirely on **synthetic data**.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Pages

- `/` — Overview: pasture map with live animal pins, herd health index, vitals, critical alerts
- `/live` — Live Monitoring: interactive predictive trend chart (per-animal baseline + ±2σ band), live feed, sensor health
- `/animals` — Animals: searchable/filterable herd table
- `/reports` — Reports: KPIs, weekly anomalies, health by group

## The data engine (the "intelligent" part)

- `lib/mock_data_generator.ts` — generates realistic herd telemetry: each animal has
  a stable baseline, circadian rhythm, gaussian noise, and ~7% carry an injected
  anomaly that ramps up over the last 48h. Deterministic (seeded) so it renders the
  same on server and client.
- `lib/anomaly.ts` — the detection engine. Computes each animal's rolling baseline
  and scores the latest reading by **z-score** against its own history. |z|>2 = watch,
  |z|>3 = critical. This is what powers the alerts, the map pins, and the trend chart.

Swap the generator for real sensor ingestion later — the `Animal` shape stays the same.

## Auth & Supabase

HerdFlow has two automatic modes:

- **Demo mode (no env vars)** — the synthetic generator drives the dashboard and
  auth is bypassed. This is what's deployed publicly. Nothing to configure.
- **Connected mode (env vars set)** — email **magic-link** auth + RLS take over.
  Unauthenticated users are redirected to `/login`.

The switch is `lib/supabase/config.ts` (`isSupabaseConfigured()`), checked in the
middleware and layout.

### Supabase setup (when ready)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (tables + RLS + `profiles` trigger).
3. Copy `.env.local.example` to `.env.local` and fill in URL + anon/publishable key.
4. **Magic link template** — in Supabase → Authentication → Email Templates →
   *Magic Link*, point the link at our confirm route:

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

5. Set the Site URL (and any preview URLs) under Authentication → URL Configuration.

> ⚠️ On the free tier, magic-link emails go through Supabase's shared SMTP with
> low rate limits — fine for a demo, but wire up a real SMTP (e.g. Resend) before
> relying on it.

### Supabase file structure

```
lib/supabase/
  config.ts       # isSupabaseConfigured() — the demo/connected switch
  client.ts       # browser client (Client Components)
  server.ts       # server client (Server Components, Route Handlers, Actions)
  middleware.ts   # session refresh + route gating
middleware.ts     # root middleware → updateSession()
app/login/        # magic-link sign-in screen
app/auth/         # confirm route handler + signOut action
```

Data still comes from `generateHerd()` even in connected mode — replacing it with
real DB queries is the next step.
