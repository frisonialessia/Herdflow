// Client-side mutations for the live demo. Two operations:
//   - injectAnomaly: append a strongly out-of-band reading so the z-score engine
//     flags the animal (used by the "trigger anomaly" button).
//   - appendTick: append one realistic new reading around the animal's baseline
//     (used by the live telemetry interval).
// Both recompute the animal's baseline / deviation / status immutably, so the
// change ripples to every page through the shared herd state.

import { Animal, MetricKey, MetricPoint } from "./types";
import { computeBaseline, detectAnomaly } from "./anomaly";

const MAX_POINTS = 120; // keep the series bounded as ticks accumulate

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stddev = (xs: number[], m: number) =>
  Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1;

function gaussian(m: number, sd: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function circadian(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60;
  return (Math.sin(((h - 6) / 24) * 2 * Math.PI) + 1) / 2;
}

// metrics relevant to a species (horses/poultry don't ruminate)
function metricsFor(a: Animal): MetricKey[] {
  const base: MetricKey[] = ["temperature_c", "activity_index", "intake_kg"];
  if (a.baseline.rumination_min > 0) base.splice(2, 0, "rumination_min");
  return base;
}

function round(metric: MetricKey, v: number): number {
  if (metric === "temperature_c") return +v.toFixed(1);
  if (metric === "intake_kg") return +v.toFixed(2);
  return Math.round(v);
}

// Recompute derived fields after the series changes (immutable).
function withSeries(a: Animal, series: MetricPoint[]): Animal {
  const trimmed = series.length > MAX_POINTS ? series.slice(series.length - MAX_POINTS) : series;
  const latest = trimmed[trimmed.length - 1];
  const baseline = computeBaseline(trimmed.slice(0, -1));
  const deviation = detectAnomaly(trimmed, metricsFor(a));
  return { ...a, series: trimmed, latest, baseline, deviation, status: deviation.severity };
}

/** Push one metric ~4σ off its baseline so detection fires. */
export function injectAnomaly(a: Animal, metric?: MetricKey): Animal {
  let m = metric ?? "temperature_c";
  if (m === "rumination_min" && a.baseline.rumination_min === 0) m = "activity_index";
  const dir = m === "temperature_c" ? 1 : -1; // fever rises; activity / rumination fall

  const window = a.series.map((p) => p[m]);
  const mu = mean(window);
  const sd = stddev(window, mu);
  const spike = Math.max(0, mu + dir * (4 * sd + Math.abs(gaussian(0, sd))));

  const next: MetricPoint = { ...a.series[a.series.length - 1], recorded_at: new Date().toISOString() };
  next[m] = round(m, spike);
  return withSeries(a, [...a.series, next]);
}

/** Append one realistic reading around the animal's baseline (live tick). */
export function appendTick(a: Animal): Animal {
  const now = new Date();
  const cyc = circadian(now);
  const b = a.baseline;
  const next: MetricPoint = {
    recorded_at: now.toISOString(),
    temperature_c: round("temperature_c", b.temperature_c + gaussian(0, 0.16)),
    activity_index: Math.max(0, Math.round(b.activity_index * (0.85 + 0.15 * cyc) + gaussian(0, 4))),
    rumination_min: Math.max(0, Math.round(b.rumination_min + gaussian(0, 18))),
    intake_kg: round("intake_kg", Math.max(0, b.intake_kg + gaussian(0, b.intake_kg * 0.07))),
    heart_rate: Math.max(0, Math.round(b.heart_rate * (0.94 + 0.06 * cyc) + gaussian(0, b.heart_rate * 0.04))),
    respiration_rate: Math.max(0, Math.round(b.respiration_rate + gaussian(0, b.respiration_rate * 0.08))),
  };
  return withSeries(a, [...a.series, next]);
}
