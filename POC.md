# HerdFlow — Detection-engine PoC

**Question this answers:** does per-animal z-score detection actually catch
illness *early*, with *few false alarms* — before any UI or polish?

**Answer (on labelled, simulated data): yes.** Reproduce with
`node scripts/poc-eval.mjs` (seeded, zero dependencies).

## Method
- **Cohort:** 120 animals with an injected illness onset at a *known* time
  (fever, or activity-collapse / lameness) + 280 healthy controls.
- **Telemetry:** a reading every 2h; 14-day rolling baseline; 7-day evaluation.
- **Detector:** each reading is scored by **z-score against the animal's own
  trailing baseline** (the idea in `lib/anomaly.ts`), with 3-reading smoothing.
  An **alert** requires the worst metric's `|z|` to exceed the threshold for **2
  consecutive readings**. The detector watches 4 signals (temperature, activity,
  rumination, intake) and does **not** know which (if any) is affected.
- **"Visible to the eye":** the point a human would notice the sign (+1.0 °C
  fever / −40 % activity). **Lead time** = time between the first alert and that
  point.

## Results

| Alert threshold | Detection (recall) | Caught before visible | Median lead | False alarms | Precision |
|---|---|---|---|---|---|
| `|z| > 2.0` | **100.0%** | 100.0% | 0.8 d | 1.4% | 96.8% |
| `|z| > 2.5` | **100.0%** | 88.3% | 0.5 d | **0.0%** | **100.0%** |
| `|z| > 3.0` | 85.0% | 71.6% | 0.3 d | 0.0% | 100.0% |

**Recommended operating point: `|z| > 2.5`** — every injected illness detected,
**zero** false alarms on healthy animals, and ~88% caught **before** a human
would notice (median ≈ 12h early). Drop to `2.0` for maximum lead time at the
cost of a small false-alarm rate.

## What this proves — and what it doesn't
- ✅ **The core idea works.** Per-animal baselines + z-score cleanly separate
  injected illness from healthy variation, early, and the false-alarm rate is
  controllable with a single threshold.
- ✅ **Noise is manageable.** Smoothing + a 2-reading persistence rule keep
  multi-signal false positives low.
- ⚠️ **This is simulated-but-labelled data.** It validates the *algorithm's
  behaviour*, not real-world physiology.
- ⚠️ **Lead time depends on ramp speed** — gradual conditions give more warning,
  peracute ones less.

## The decisive next step (Phase 1)
Run **this exact evaluation on real farm telemetry** with vet-confirmed
outcomes. That turns this from "the algorithm behaves correctly" into "it
catches real mastitis/estrus X days early" — the number that sells.

## Reproduce
```bash
node scripts/poc-eval.mjs
```
