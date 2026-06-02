// Synthetic data generator — produces realistic-looking herd telemetry.
// Each animal has a stable "personality" (its own baseline), a circadian rhythm
// (more active by day), small gaussian noise, and a subset carry an injected
// anomaly that worsens over the last ~48h so the dashboard looks alive.
//
// Swap this module for real sensor ingestion later; the shape of `Animal` stays.

import {
  Animal, MetricPoint, Species, MetricKey,
  SPECIES_NORMS, SPECIES_LABEL,
} from "./types";
import { computeBaseline, detectAnomaly } from "./anomaly";

// --- deterministic RNG so the demo renders the same on server & client ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rnd: () => number, m: number, sd: number): number {
  const u = 1 - rnd(), v = rnd();
  return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// circadian factor 0..1 (peaks midday)
function circadian(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60;
  return (Math.sin(((h - 6) / 24) * 2 * Math.PI) + 1) / 2;
}

const FIRST = ["Lola", "Trueno", "Estrella", "Nube", "Bruno", "Coral", "Sauco", "Rocío", "Duna", "Tomillo"];
const PADDOCKS = ["Pasture A", "Pasture B", "Paddock 2", "North Field", "Barn 1"];
const SPECIES_POOL: Species[] = ["dairy", "dairy", "dairy", "beef", "beef", "sheep", "sheep", "horse", "poultry"];

// which metrics matter per species (horses/poultry don't ruminate)
function metricsFor(sp: Species): MetricKey[] {
  const base: MetricKey[] = ["temperature_c", "activity_index", "intake_kg"];
  if (sp === "dairy" || sp === "beef" || sp === "sheep") base.splice(2, 0, "rumination_min");
  return base;
}

function buildSeries(
  rnd: () => number, sp: Species,
  base: typeof SPECIES_NORMS[Species],
  anomaly: { metric: MetricKey; intensity: number } | null,
  days = 14, stepHrs = 4
): MetricPoint[] {
  const pts: MetricPoint[] = [];
  const now = Date.now();
  const steps = (days * 24) / stepHrs;

  for (let s = steps; s >= 0; s--) {
    const t = new Date(now - s * stepHrs * 3600_000);
    const cyc = circadian(t);
    // anomaly ramps in over the final 48h (12 steps at 4h)
    const recent = s < 12 ? (12 - s) / 12 : 0;

    const tempBoost = anomaly?.metric === "temperature_c" ? anomaly.intensity * 0.55 * recent : 0;
    const actDrop   = anomaly?.metric === "activity_index" ? anomaly.intensity * 13 * recent : 0;
    const rumDrop   = anomaly?.metric === "rumination_min" ? anomaly.intensity * 55 * recent : 0;

    pts.push({
      recorded_at: t.toISOString(),
      temperature_c: +(base.temperature_c + tempBoost + gaussian(rnd, 0, 0.18)).toFixed(1),
      activity_index: Math.max(0, Math.round(base.activity_index * (0.65 + 0.35 * cyc) - actDrop + gaussian(rnd, 0, 5))),
      rumination_min: Math.max(0, Math.round(base.rumination_min - rumDrop + gaussian(rnd, 0, 22))),
      intake_kg: +Math.max(0, base.intake_kg + gaussian(rnd, 0, base.intake_kg * 0.07)).toFixed(2),
    });
  }
  return pts;
}

export function generateHerd(count = 40, seed = 99): Animal[] {
  const rnd = mulberry32(seed);
  const herd: Animal[] = [];

  for (let i = 0; i < count; i++) {
    const sp = SPECIES_POOL[Math.floor(rnd() * SPECIES_POOL.length)];
    const norm = SPECIES_NORMS[sp];
    const metrics = metricsFor(sp);

    // ~7% carry an anomaly
    const hasAnomaly = rnd() < 0.07;
    const anomaly = hasAnomaly
      ? {
          metric: (rnd() < 0.55 ? "temperature_c" : metrics.includes("rumination_min") && rnd() < 0.5 ? "rumination_min" : "activity_index") as MetricKey,
          intensity: gaussian(rnd, 2.6, 0.6),
        }
      : null;

    // individualised baseline (each animal slightly different)
    const personal = {
      temperature_c: gaussian(rnd, norm.temperature_c, 0.15),
      activity_index: gaussian(rnd, norm.activity_index, 7),
      rumination_min: norm.rumination_min ? gaussian(rnd, norm.rumination_min, 25) : 0,
      intake_kg: gaussian(rnd, norm.intake_kg, norm.intake_kg * 0.08),
    };

    const series = buildSeries(rnd, sp, personal, anomaly);
    const baseline = computeBaseline(series.slice(0, -1));
    const deviation = detectAnomaly(series, metrics);
    const latest = series[series.length - 1];

    herd.push({
      id: crypto.randomUUID(),
      tag_id: `ES${(100000 + i * 7 + 1).toString()}`,
      name: `${FIRST[i % FIRST.length]}${i >= FIRST.length ? " " + (Math.floor(i / FIRST.length) + 1) : ""}`,
      species: sp,
      lot: SPECIES_LABEL[sp],
      paddock: PADDOCKS[Math.floor(rnd() * PADDOCKS.length)],
      x: 8 + rnd() * 84,
      y: 12 + rnd() * 76,
      baseline,
      series,
      latest,
      deviation,
      status: deviation.severity,
    });
  }

  // sort so critical/watch float to the top of lists
  const order = { critical: 0, watch: 1, healthy: 2 };
  return herd.sort((a, b) => order[a.status] - order[b.status]);
}

// Convenience aggregate for the Overview header.
export function herdSummary(herd: Animal[]) {
  const healthy = herd.filter((a) => a.status === "healthy").length;
  const watch = herd.filter((a) => a.status === "watch").length;
  const critical = herd.filter((a) => a.status === "critical").length;
  const index = +((healthy / herd.length) * 100).toFixed(1);
  return { total: herd.length, healthy, watch, critical, index };
}
