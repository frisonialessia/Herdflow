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

## Connecting Supabase (when ready)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (tables + RLS).
3. Copy `.env.local.example` to `.env.local` and fill in URL + anon key.
4. Replace `generateHerd()` calls with queries via `lib/supabase.ts`.

Currently the demo does **not** require any environment variables.
