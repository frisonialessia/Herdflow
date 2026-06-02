# HerdFlow — Master Documentation

Predictive livestock health monitoring. This document is the single technical +
product reference for the project. For the 1-page pitch see
[`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md); for strategy
[`ROADMAP.md`](./ROADMAP.md); for the engine validation [`POC.md`](./POC.md).

---

## 1. Vision
Catch animal illness — fever, lameness, off-feed, missed heats — **before it's
visible to the eye**, using behavioural telemetry and per-animal baselines.
Target user: a non-technical farm owner (cattle, sheep, horses, poultry).

## 2. The science (how detection works)
Each animal is its **own control**. We keep a rolling baseline of its normal
range per signal and score the latest reading with a **z-score** (how many
standard deviations from its own mean):

- `|z| > 2` → **watch**
- `|z| > 3` → **critical**

The most-deviated signal is surfaced and mapped to a **likely condition**
(`lib/conditions.ts`): temperature up → fever / possible mastitis; activity up →
possible estrus; activity down → possible lameness; rumination/intake down →
off-feed / ketosis risk. This makes every alert **explainable**, which is the
core differentiator vs black-box AI.

Core engine: [`lib/anomaly.ts`](./lib/anomaly.ts) — `computeBaseline`,
`detectAnomaly`, `normalBand`.

## 3. Signals tracked
Temperature (°C), activity index, rumination (min), feed intake (kg), heart rate
(bpm), respiration (/min). Species-specific normal ranges live in
`lib/types.ts` (`SPECIES_NORMS`).

## 4. Product tour
- **Landing (`/`)** — hero with a live animated chart (an animal breaking its
  ±2σ band), a clickable farm map, a "how it works" + z-score explainer, and a
  CTA that drops you straight into a running anomaly (`?play=fever`).
- **Dashboard (`/dashboard`)** — Overview: pasture map (zoomable), herd health
  index, vitals, alerts.
- **Live Monitoring (`/dashboard/live`)** — interactive predictive trend chart
  (per-animal baseline + ±2σ band), live feed, sensor health.
- **Animals (`/dashboard/animals`)** — searchable / filterable herd table.
- **Reports (`/dashboard/reports`)** — KPIs, weekly anomalies, health by group.
- **Impact (`/dashboard/impact`)** — an adjustable ROI calculator.
- **Detail drawer** — click any animal for vitals vs baseline, its trend, a
  suspected condition, and reading history.
- **Demo controls** — simulate an anomaly or stream live telemetry; reset.

## 5. The data engine (synthetic)
[`lib/mock_data_generator.ts`](./lib/mock_data_generator.ts) produces realistic
herd telemetry: each animal has a stable personal baseline, a circadian rhythm,
gaussian noise, and a subset carry an anomaly that ramps over the last ~48h. It
is **deterministic** (a seeded `mulberry32` RNG) so server and client render
identically — no hydration mismatch. [`lib/herd_sim.ts`](./lib/herd_sim.ts)
appends new readings for the "live" tick and injects anomalies on demand.

This module is the seam: swap it for real sensor ingestion later — the `Animal`
shape (`lib/types.ts`) is the contract.

## 6. Architecture
- **Next.js 14 (App Router)**, statically prerendered. Route split:
  - `app/page.tsx` → marketing landing.
  - `app/dashboard/*` → the app, under a shared `dashboard/layout.tsx`.
- **Client state via React Context** — `components/HerdProvider.tsx` holds one
  "living herd" shared across pages, the selected animal, live-telemetry
  interval, and simulate/add/reset actions.
- **No backend** — runs entirely on synthetic data; no env vars, no secrets.
- **Rendering** — all routes are static (`○`); the dashboard "connects" with a
  short skeleton, then animates client-side.

Key components: `PastureMap`, `TrendChart`, `HeroDemo`, `ZScoreExplainer`,
`FarmMapPreview` (SVG visuals), `AnimalDrawer`, `DemoControls`, `DemoAutoplay`,
`DashboardShell`/`DashboardSkeleton`, `SettingsModal`, `BrandMark`, `TopNav`.

## 7. Tech stack
| Area | Choice |
|---|---|
| Language | **TypeScript** (app), **JavaScript / ESM** (`scripts/poc-eval.mjs`) |
| UI | **React 18**, **Next.js 14** (App Router), **TSX** |
| Styling | **Tailwind CSS 3** + CSS variables (`app/globals.css`) |
| Icons | **lucide-react** (emoji for species by choice) |
| Graphics | hand-built **SVG** (charts, maps, brand mark, favicon) |
| Social card | **next/og** `ImageResponse` (`app/opengraph-image.tsx`) |
| Eval | **Node.js** (zero-dependency script) |
| Tooling | **Git / GitHub**, **Vercel** (deploy), `npm` |
| Fonts | Sora (headings/numbers) + Outfit (body) |

## 8. Design system
Sage greens + earth brown only (`--sage-deep #3a5a40`, `--sage #588157`,
`--brown #7a5230`…). Health states are green/brown, never red/amber: healthy
`#588157`, watch `#9a9a5e`, critical `#8a4f32`. Flat chart colours, no gradients.

## 9. Validation (PoC)
The detection engine was evaluated on labelled, simulated telemetry
([`scripts/poc-eval.mjs`](./scripts/poc-eval.mjs)). At `|z|>2.5`: **100%
detection, 0% false alarms, ~88% caught before visible** (median ~12h lead).
Full method and results in [`POC.md`](./POC.md).

## 10. What's real vs illustrative
- **Real / computed:** the z-score engine, per-animal baselines, condition
  inference, herd health index, the PoC metrics.
- **Illustrative (labelled as such in the UI):** sensor battery, some Reports
  KPIs, the ROI assumptions, weekly anomaly bars.
- All telemetry is **synthetic** — by design for the demo.

## 11. Repository layout
```
app/            # routes (landing + dashboard), layouts, OG image, favicon
components/     # UI + visuals + providers
lib/            # types, detection engine, data generator, conditions, format
scripts/        # poc-eval.mjs (engine validation)
*.md            # README, EXECUTIVE_SUMMARY, DOCUMENTATION, ROADMAP, POC
```

## 12. Run locally
```bash
npm install
npm run dev          # http://localhost:3000
node scripts/poc-eval.mjs   # reproduce the PoC numbers
```

## 13. Status & limitations
- ✅ Polished interactive demo + validated engine (on labelled data).
- ⚠️ No real telemetry yet; not a clinical/regulatory product.
- ▶️ Next: **Phase 1** — ingest real farm data and validate one detection
  (mastitis / estrus) against vet diagnosis. See [`ROADMAP.md`](./ROADMAP.md).

---
*Building in Public. Figures are industry-ballpark and illustrative until
validated with pilot data.*
