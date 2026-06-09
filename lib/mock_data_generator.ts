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
import { generateProfile } from "./profile";

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

// Pin a healthy animal's most-recent reading onto its own baseline (latest ≈
// window mean), so it scores cleanly healthy. Without this, ~1 in 5 calm animals
// trips a z>2 false positive on sensor noise and the demo herd looks alarmingly
// sick (40% "enfermo"). With it, only animals carrying an injected anomaly show
// up — the herd reads ~90% healthy, like a real one.
function calmLatest(rnd: () => number, series: MetricPoint[]) {
  const w = series.slice(0, -1);
  const last = series[series.length - 1];
  const keys: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate"];
  for (const k of keys) {
    const mean = w.reduce((s, p) => s + p[k], 0) / w.length;
    const sd = Math.sqrt(w.reduce((s, p) => s + (p[k] - mean) ** 2, 0) / w.length) || 1;
    last[k] = mean + gaussian(rnd, 0, sd * 0.25); // comfortably within ±1σ → healthy
  }
  last.temperature_c = +last.temperature_c.toFixed(1);
  last.intake_kg = +Math.max(0, last.intake_kg).toFixed(2);
  last.activity_index = Math.round(Math.max(0, last.activity_index));
  last.rumination_min = Math.round(Math.max(0, last.rumination_min));
  last.heart_rate = Math.round(Math.max(0, last.heart_rate));
  last.respiration_rate = Math.round(Math.max(0, last.respiration_rate));
}

// circadian factor 0..1 (peaks midday)
function circadian(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60;
  return (Math.sin(((h - 6) / 24) * 2 * Math.PI) + 1) / 2;
}

const FIRST = ["Lola", "Trueno", "Estrella", "Nube", "Bruno", "Coral", "Sauco", "Rocío", "Duna", "Tomillo"];
const PADDOCKS = ["Potrero A", "Potrero B", "Corral 2", "Potrero Norte", "Granero 1"];
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
      heart_rate: Math.max(0, Math.round(base.heart_rate * (0.92 + 0.08 * cyc) + gaussian(rnd, 0, base.heart_rate * 0.04))),
      respiration_rate: Math.max(0, Math.round(base.respiration_rate + gaussian(rnd, 0, base.respiration_rate * 0.08))),
    });
  }
  return pts;
}

// Build one animal from a seeded RNG. `kind` injects an anomaly:
//   "mild"   → a slight fever that reads as vigilancia,
//   "strong" → an acute fever / off-feed that reads as crítico,
//   null     → healthy (calmLatest below keeps the latest reading clearly normal).
function makeAnimal(
  i: number,
  rnd: () => number,
  kind: "mild" | "strong" | null,
  override?: { id?: string; name?: string; species?: Species }
): Animal {
  const sp = override?.species ?? SPECIES_POOL[Math.floor(rnd() * SPECIES_POOL.length)];
  const norm = SPECIES_NORMS[sp];
  const metrics = metricsFor(sp);

  let anomaly: { metric: MetricKey; intensity: number } | null = null;
  if (kind === "mild") {
    anomaly = { metric: "temperature_c", intensity: gaussian(rnd, 0.85, 0.05) }; // slight fever → vigilancia
  } else if (kind === "strong") {
    const metric = (rnd() < 0.6 ? "temperature_c" : metrics.includes("rumination_min") && rnd() < 0.5 ? "rumination_min" : "activity_index") as MetricKey;
    anomaly = { metric, intensity: gaussian(rnd, 2.6, 0.5) }; // acute → crítico
  }

  // individualised baseline (each animal slightly different)
  const personal = {
    temperature_c: gaussian(rnd, norm.temperature_c, 0.15),
    activity_index: gaussian(rnd, norm.activity_index, 7),
    rumination_min: norm.rumination_min ? gaussian(rnd, norm.rumination_min, 25) : 0,
    intake_kg: gaussian(rnd, norm.intake_kg, norm.intake_kg * 0.08),
    heart_rate: gaussian(rnd, norm.heart_rate, norm.heart_rate * 0.05),
    respiration_rate: gaussian(rnd, norm.respiration_rate, norm.respiration_rate * 0.06),
  };

  const series = buildSeries(rnd, sp, personal, anomaly);
  if (!anomaly) calmLatest(rnd, series); // calm animals read cleanly healthy
  const baseline = computeBaseline(series.slice(0, -1));
  const deviation = detectAnomaly(series, metrics);
  const latest = series[series.length - 1];

  return {
    id: override?.id ?? `an-${i}`,
    tag_id: `ES${(100000 + i * 7 + 1).toString()}`,
    name: override?.name ?? `${FIRST[i % FIRST.length]}${i >= FIRST.length ? " " + (Math.floor(i / FIRST.length) + 1) : ""}`,
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
    profile: generateProfile(sp, rnd),
  };
}

export function generateHerd(count = 40, seed = 99): Animal[] {
  const rnd = mulberry32(seed);
  const herd: Animal[] = [];
  // Deterministic, realistic mix: ~87% sano, a few "vigilancia" and 1–2 "crítico"
  // — a well-managed ranch, not a crisis. (Outbreaks are shown on demand via the
  // live demo, not forced into the resting state.)
  const sick = Math.max(2, Math.round(count * 0.13));
  const criticals = Math.max(1, Math.round(sick * 0.3));
  for (let i = 0; i < count; i++) {
    const kind = i < criticals ? "strong" : i < sick ? "mild" : null;
    herd.push(makeAnimal(i, rnd, kind));
  }

  // sort so critical/watch float to the top of lists
  const order = { critical: 0, watch: 1, healthy: 2 };
  return herd.sort((a, b) => order[a.status] - order[b.status]);
}

// A single fresh animal for the demo's "Add animal" action — healthy by default,
// with a random seed so each one differs.
export function generateAnimal(
  i: number,
  seed = Date.now(),
  override?: { id?: string; name?: string; species?: Species }
): Animal {
  return makeAnimal(i, mulberry32(seed), null, override);
}

// Convenience aggregate for the Overview header.
export function herdSummary(herd: Animal[]) {
  const healthy = herd.filter((a) => a.status === "healthy").length;
  const watch = herd.filter((a) => a.status === "watch").length;
  const critical = herd.filter((a) => a.status === "critical").length;
  const index = herd.length ? +((healthy / herd.length) * 100).toFixed(1) : 100;
  return { total: herd.length, healthy, watch, critical, index };
}
