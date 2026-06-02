# HerdFlow

Predictive livestock health monitoring — detects animal health anomalies
(fever, activity collapse, reduced rumination) **before they're visible to the eye**,
using behavioural telemetry and per-animal z-score baselines.

**This is an interactive demo.** It runs entirely in the browser on synthetic
data — no backend, no accounts, nothing to configure.

Built with Next.js 14 (App Router) · TypeScript · Tailwind · Lucide icons.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Pages

- `/` — Overview: pasture map with live animal pins, herd health index, vitals, critical alerts
- `/live` — Live Monitoring: interactive predictive trend chart (per-animal baseline + ±2σ band), live feed, sensor health
- `/animals` — Animals: searchable / filterable herd table
- `/reports` — Reports: KPIs, weekly anomalies, health by group

## The data engine (the "intelligent" part)

- `lib/mock_data_generator.ts` — generates realistic herd telemetry: each animal has
  a stable baseline, circadian rhythm, gaussian noise, and ~7% carry an injected
  anomaly that ramps up over the last 48h. Deterministic (seeded) so it renders the
  same way every load.
- `lib/anomaly.ts` — the detection engine. Computes each animal's rolling baseline
  and scores the latest reading by **z-score** against its own history. |z|>2 = watch,
  |z|>3 = critical. This is what powers the alerts, the map pins, and the trend chart.

All data is synthetic and for demonstration purposes only.

## Docs

- [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md) — one-page pitch
- [`DOCUMENTATION.md`](./DOCUMENTATION.md) — master technical + product reference
- [`ROADMAP.md`](./ROADMAP.md) — strategy & 0→1 roadmap
- [`POC.md`](./POC.md) — detection-engine validation (run `node scripts/poc-eval.mjs`)
