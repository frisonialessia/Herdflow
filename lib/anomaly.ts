// Anomaly detection engine — z-score over the animal's own rolling baseline.
// Each animal is its own control: we compare the latest reading against the
// mean + standard deviation of its historical window, not against the herd.

import { MetricPoint, MetricKey, Deviation, Severity, Baseline } from "./types";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const stddev = (xs: number[], m: number) =>
  Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1; // guard /0

/** Mean of each metric across a window — the animal's personal baseline. */
export function computeBaseline(window: MetricPoint[]): Baseline {
  const keys: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg"];
  const out = {} as Baseline;
  for (const k of keys) out[k] = +mean(window.map((p) => p[k])).toFixed(2);
  return out;
}

function severityFromZ(absZ: number): Severity {
  if (absZ > 3) return "critical";
  if (absZ > 2) return "watch";
  return "healthy";
}

/**
 * Detect the most-deviated metric for an animal.
 * The window is all readings except the latest; the latest is scored against it.
 * Metrics that are not meaningful for a species (e.g. rumination for horses)
 * are skipped via the `metrics` arg.
 */
export function detectAnomaly(
  series: MetricPoint[],
  metrics: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg"]
): Deviation {
  const window = series.slice(0, -1);
  const latest = series[series.length - 1];

  let worst: Deviation = {
    metric: "temperature_c",
    z_score: 0,
    baseline: 0,
    observed: 0,
    severity: "healthy",
  };

  for (const key of metrics) {
    const vals = window.map((p) => p[key]);
    const m = mean(vals);
    const sd = stddev(vals, m);
    const z = (latest[key] - m) / sd;
    if (Math.abs(z) > Math.abs(worst.z_score)) {
      worst = {
        metric: key,
        z_score: +z.toFixed(2),
        baseline: +m.toFixed(2),
        observed: latest[key],
        severity: severityFromZ(Math.abs(z)),
      };
    }
  }
  return worst;
}

/** ±2σ band around a baseline value, for charting the "normal range". */
export function normalBand(window: number[]): { lower: number; upper: number; mean: number } {
  const m = mean(window);
  const sd = stddev(window, m);
  return { mean: m, lower: m - 2 * sd, upper: m + 2 * sd };
}
