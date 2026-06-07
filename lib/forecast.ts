// Predictive layer: turns the per-animal z-score history into the product's
// core claim — "we flagged this BEFORE it was visible." All derived honestly
// from the animal's own series:
//   • lead time   — when the metric first crossed ±2σ (watch) vs. now / critical
//   • projection  — extrapolate the recent slope to estimate time-to-critical
//   • escalation  — the healthy → watch → critical transitions, with timestamps
//
// Pure & deterministic, like lib/anomaly.ts.

import { Animal, MetricKey, Severity } from "./types";

export interface CaseForecast {
  metric: MetricKey;
  direction: "rising" | "falling";
  level: Severity;
  zNow: number; // signed
  firstFlagAt: string | null; // first ±2σ crossing
  hoursSinceFlag: number | null; // early-warning duration (first flag → now)
  becameCriticalAt: string | null;
  hoursFlagToCritical: number | null; // the headline when already critical
  projectionHours: number | null; // est. hours until ±3σ (null if not heading there)
  alreadyCritical: boolean;
  projectionValues: number[]; // forecasted metric values, one per future step
  stepHours: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const std = (xs: number[], m: number) => Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1;

export function analyzeForecast(a: Animal): CaseForecast | null {
  const m = a.deviation.metric;
  const series = a.series;
  const n = series.length;
  if (n < 8) return null;

  const vals = series.map((p) => p[m]);
  const times = series.map((p) => new Date(p.recorded_at).getTime());
  const stepHours = Math.max(1, Math.round((times[n - 1] - times[0]) / (n - 1) / 3_600_000));

  // Calm baseline from the early part of the record (before any ramp-in).
  const B = Math.max(4, Math.floor(n * 0.6));
  const base = vals.slice(0, B);
  const mu = mean(base);
  const sd = std(base, mu);

  const last = vals[n - 1];
  const direction: "rising" | "falling" = last >= mu ? "rising" : "falling";
  const zNow = +((last - mu) / sd).toFixed(2);
  const crosses = (v: number, k: number) => (direction === "rising" ? v >= mu + k * sd : v <= mu - k * sd);
  const level: Severity = crosses(last, 3) ? "critical" : crosses(last, 2) ? "watch" : "healthy";

  let firstFlagIdx = -1;
  let firstCritIdx = -1;
  for (let i = B; i < n; i++) {
    if (firstFlagIdx < 0 && crosses(vals[i], 2)) firstFlagIdx = i;
    if (firstCritIdx < 0 && crosses(vals[i], 3)) {
      firstCritIdx = i;
      break;
    }
  }

  const now = times[n - 1];
  const firstFlagAt = firstFlagIdx >= 0 ? series[firstFlagIdx].recorded_at : null;
  const hoursSinceFlag = firstFlagIdx >= 0 ? Math.round((now - times[firstFlagIdx]) / 3_600_000) : null;
  const becameCriticalAt = firstCritIdx >= 0 ? series[firstCritIdx].recorded_at : null;
  const hoursFlagToCritical =
    firstFlagIdx >= 0 && firstCritIdx >= 0 ? Math.round((times[firstCritIdx] - times[firstFlagIdx]) / 3_600_000) : null;

  // Linear slope (value per step) over the last K readings.
  const K = Math.min(6, n);
  const ys = vals.slice(n - K);
  const mx = (K - 1) / 2;
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < K; i++) {
    num += (i - mx) * (ys[i] - my);
    den += (i - mx) ** 2;
  }
  const slope = den ? num / den : 0;

  const critLevel = direction === "rising" ? mu + 3 * sd : mu - 3 * sd;
  const alreadyCritical = crosses(last, 3);
  let projectionHours: number | null = null;
  if (!alreadyCritical) {
    const movingToward = direction === "rising" ? slope > 0 : slope < 0;
    if (movingToward) {
      const steps = (critLevel - last) / slope; // same sign as slope when heading there
      if (steps > 0 && steps < 60) projectionHours = Math.max(1, Math.round(steps * stepHours));
    }
  }

  const F = 6;
  const projectionValues = Array.from({ length: F }, (_, j) => +(last + slope * (j + 1)).toFixed(2));

  return {
    metric: m,
    direction,
    level,
    zNow,
    firstFlagAt,
    hoursSinceFlag,
    becameCriticalAt,
    hoursFlagToCritical,
    projectionHours,
    alreadyCritical,
    projectionValues,
    stepHours,
  };
}
