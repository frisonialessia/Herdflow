// Heat-stress layer (THI — Temperature-Humidity Index).
//
// Cattle don't sweat efficiently; in hot, humid weather they accumulate heat
// faster than they can shed it, which crushes intake, milk yield and fertility
// and — at the extreme — kills. The industry-standard early-warning metric is
// the THI, combining air temperature and relative humidity into one number.
//
// This module:
//   • models today's ambient conditions as a deterministic diurnal curve
//     (a hot, humid climate — relevant to much of Mexico's dairy regions),
//   • computes the NRC THI and classifies it into action bands,
//   • scores each animal's individual heat load (ambient exposure × species
//     sensitivity, nudged by its own panting / body-temp signals).
//
// Pure & deterministic given (herd, time), like lib/forecast.ts.

import { Animal, Species } from "./types";

export type HeatBand = "none" | "mild" | "danger" | "emergency";

export interface BandInfo {
  key: HeatBand;
  label: string;
  color: string;
  advice: string;
}

// THI thresholds follow the widely-used dairy scale (comfort < 72, then mild,
// danger, emergency). Colours map onto the app's existing severity palette.
export const BANDS: Record<HeatBand, BandInfo> = {
  none: {
    key: "none",
    label: "No heat stress",
    color: "var(--healthy)",
    advice: "Conditions are comfortable — normal grazing and handling.",
  },
  mild: {
    key: "mild",
    label: "Mild heat stress",
    color: "var(--watch)",
    advice: "Ensure shade and clean water are available; keep an eye on high-yield cows.",
  },
  danger: {
    key: "danger",
    label: "Heat danger",
    color: "var(--critical)",
    advice: "Open all shade, add water troughs, run sprinklers + fans 11 AM–5 PM, and avoid handling or transport at peak.",
  },
  emergency: {
    key: "emergency",
    label: "Heat emergency",
    color: "#6f3a22",
    advice: "Emergency cooling now — sprinklers + forced air, cold drinking water, halt all handling, and check downers with the vet.",
  },
};

export function classifyThi(thi: number): BandInfo {
  if (thi >= 89) return BANDS.emergency;
  if (thi >= 79) return BANDS.danger;
  if (thi >= 72) return BANDS.mild;
  return BANDS.none;
}

/** NRC Temperature-Humidity Index from dry-bulb °C and relative humidity %. */
export function thi(tempC: number, rh: number): number {
  return (1.8 * tempC + 32) - (0.55 - 0.0055 * rh) * (1.8 * tempC - 26);
}

export interface Ambient {
  tempC: number;
  rh: number;
  thi: number;
  hour: number; // 0..24 (fractional)
}

// Small, stable day-to-day variation so consecutive demos aren't identical,
// derived from the date (not wall clock) to stay deterministic within a day.
function daySeed(d: Date): number {
  const day = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
  return ((day * 9301 + 49297) % 233280) / 233280; // 0..1
}

// Diurnal model: temperature minimum ~03:00, maximum ~15:00; humidity runs
// inversely (humid nights, drier afternoons). Tuned to a hot, muggy climate so
// the afternoon peak lands squarely in the "danger" band.
function ambientAt(hour: number, seed: number): Ambient {
  const tMean = 30 + (seed - 0.5) * 4; // 28..32 °C
  const rhMean = 65 + (seed - 0.5) * 10; // 60..70 %
  const phase = Math.cos((2 * Math.PI * (hour - 15)) / 24); // +1 at 15:00, -1 at 03:00
  const tempC = tMean + 6 * phase;
  const rh = Math.max(35, Math.min(95, rhMean - 18 * phase));
  return { tempC, rh, thi: thi(tempC, rh), hour };
}

// Per-species heat sensitivity (dairy cows generate the most metabolic heat and
// suffer first; poultry are also highly vulnerable; range hardier).
const HEAT_SENS: Record<Species, number> = {
  dairy: 1.0,
  poultry: 0.96,
  beef: 0.82,
  sheep: 0.78,
  horse: 0.72,
};

export type RiskBand = "low" | "moderate" | "high" | "extreme";

export interface AnimalHeat {
  score: number; // 0..100
  band: RiskBand;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function riskBand(score: number): RiskBand {
  if (score >= 80) return "extreme";
  if (score >= 65) return "high";
  if (score >= 40) return "moderate";
  return "low";
}

// An animal's heat load = ambient exposure (scaled by species sensitivity) plus
// its own physiological signs of struggling: panting (respiration above its
// baseline) and a rising body temperature.
export function heatRiskFor(a: Animal, peakThi: number): AnimalHeat {
  // Ambient exposure floor for the whole herd: a THI-danger afternoon (~85) puts
  // the most heat-sensitive species into the "high" band on its own.
  const ambientBase = clamp((peakThi - 60) / (90 - 60), 0, 1) * 80; // 0..80
  const exposure = ambientBase * HEAT_SENS[a.species];

  const baseResp = a.baseline.respiration_rate || 1;
  const panting = clamp(a.latest.respiration_rate / baseResp - 1, 0, 1) * 22;
  const tempExc = clamp(a.latest.temperature_c - a.baseline.temperature_c, 0, 2) * 9;

  const score = Math.round(clamp(exposure + panting + tempExc, 0, 100));
  return { score, band: riskBand(score) };
}

export interface HeatSummary {
  now: Ambient;
  nowBand: BandInfo;
  peak: Ambient;
  peakBand: BandInfo;
  hoursToPeak: number; // 0 if peak already passed today
  pastPeak: boolean;
  risks: { animal: Animal; heat: AnimalHeat }[]; // sorted high → low
  atRiskCount: number; // score >= 65
  topSpecies: Species | null; // most-exposed species among the herd
}

/** Roll the per-animal heat risk up into a herd-level briefing for `time`. */
export function summarizeHeat(herd: Animal[], time: Date): HeatSummary {
  const seed = daySeed(time);
  const hourNow = time.getHours() + time.getMinutes() / 60;
  const now = ambientAt(hourNow, seed);
  const peak = ambientAt(15, seed);
  const hoursToPeak = hourNow <= 15 ? +(15 - hourNow).toFixed(1) : 0;

  const risks = herd
    .map((animal) => ({ animal, heat: heatRiskFor(animal, peak.thi) }))
    .sort((a, b) => b.heat.score - a.heat.score);

  const atRiskCount = risks.filter((r) => r.heat.score >= 65).length;

  // Which species carries the highest average load (for "dairy most exposed").
  const bySpecies = new Map<Species, { sum: number; n: number }>();
  for (const r of risks) {
    const cur = bySpecies.get(r.animal.species) ?? { sum: 0, n: 0 };
    bySpecies.set(r.animal.species, { sum: cur.sum + r.heat.score, n: cur.n + 1 });
  }
  let topSpecies: Species | null = null;
  let topAvg = -1;
  for (const [sp, { sum, n }] of bySpecies) {
    const avg = sum / n;
    if (avg > topAvg) {
      topAvg = avg;
      topSpecies = sp;
    }
  }

  return {
    now,
    nowBand: classifyThi(now.thi),
    peak,
    peakBand: classifyThi(peak.thi),
    hoursToPeak,
    pastPeak: hourNow > 15,
    risks,
    atRiskCount,
    topSpecies,
  };
}
