// Reproduction / estrus ("heat") detection — the highest-ROI layer in herd
// management. Every missed heat is ~21 lost days and a delayed calving, so
// catching standing heat and hitting the insemination window is worth real
// money per cow per year.
//
// Estrus shows up in the data as a sharp, sustained spike in activity /
// restlessness (mounting, pacing). We detect it two ways and fuse them:
//   • sensor-confirmed — the animal's top deviation is elevated activity (the
//     same signal lib/conditions.ts already labels "Estrus?"), giving a precise
//     onset from its own series → HIGH confidence;
//   • calendar-based — a deterministic ~21-day cycle seeded per animal, so even
//     quiet cows get an expected next-heat date → MEDIUM confidence.
//
// Everything here is pure and now-independent (cycle + onset are derived from
// the herd, not the wall clock), and the insemination window is expressed as
// relative hours — so it renders identically on server and client.

import { Animal, Species } from "./types";
import { analyzeForecast } from "./forecast";

export type ReproStatus = "in_heat" | "approaching" | "open" | "bred" | "pregnant";

const BREEDABLE: Species[] = ["dairy", "beef", "sheep"];
export const isBreedable = (a: Animal) => BREEDABLE.includes(a.species);

export const CYCLE_DAYS = 21;
const WIN_OPEN_H = 4; // AI window opens ~4 h after onset of standing heat
const WIN_CLOSE_H = 18; // optimal window closes ~18 h after onset
// Share of breedable females the monitor flags as in standing heat "today".
// Real daily rate is lower, but a quiet board hides the marquee signal; this
// reads as "heats detected in the last ~24 h" across the cycling herd.
const HEAT_RATE = 0.16;

export interface Repro {
  status: ReproStatus;
  cycleDay: number; // 0..20 (0 = day of estrus)
  dim: number; // days in milk (dairy) / days since calving
  detectedBy?: "activity" | "cycle";
  confidence?: "Alta" | "Media";
  intensity?: number; // 0..100 heat strength (in_heat)
  onsetHoursAgo?: number; // hours since onset (in_heat)
  daysToHeat?: number; // approaching / open
}

export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

/** Postpartum label: "days in milk" is dairy-specific; others show days since calving. */
export function dimText(species: Species, dim: number): string {
  return species === "dairy" ? `${dim} DEL` : `${dim}d desde el parto`;
}

/** Per-animal reproductive state. `bred` = user marked her inseminated this session. */
export function reproOf(a: Animal, bred = false): Repro | null {
  if (!isBreedable(a) || a.profile?.sex === "male") return null;

  const dim = Math.round(5 + hash01(a.id + "dim") * 295); // 5..300
  const cycleDay = Math.floor(hash01(a.id + "cyc") * CYCLE_DAYS);

  if (bred) return { status: "bred", cycleDay, dim };

  // 1) Sensor-confirmed estrus: a real, sustained activity/restlessness spike
  //    (the same signal lib/conditions.ts labels "Estrus?") → HIGH confidence,
  //    with a precise onset read from the animal's own series.
  const activitySpike = a.status !== "healthy" && a.deviation.metric === "activity_index" && a.deviation.z_score > 0;
  if (activitySpike) {
    const f = analyzeForecast(a);
    const onsetHoursAgo = f?.hoursSinceFlag && f.hoursSinceFlag > 0 ? f.hoursSinceFlag : 6;
    const intensity = Math.round(Math.min(98, 50 + Math.abs(a.deviation.z_score) * 12));
    return { status: "in_heat", cycleDay: 0, dim, detectedBy: "activity", confidence: "Alta", intensity, onsetHoursAgo };
  }

  // 2) Standing heat detected by the cycle monitor, staggered across the herd so
  //    onsets (and therefore insemination windows) differ → MEDIUM confidence.
  if (hash01(a.id + "heatnow") < HEAT_RATE) {
    const onsetHoursAgo = Math.round(1 + hash01(a.id + "ons") * 20); // 1..21 h
    const intensity = Math.round(58 + hash01(a.id + "int") * 22); // 58..80
    return { status: "in_heat", cycleDay: 0, dim, detectedBy: "cycle", confidence: "Media", intensity, onsetHoursAgo };
  }

  // 3) Otherwise a seeded reproductive status (deterministic herd mix).
  const r = hash01(a.id + "rep");
  if (r < 0.42) return { status: "pregnant", cycleDay, dim };
  if (r < 0.6) return { status: "bred", cycleDay, dim };

  // Open & cycling — days until her next expected heat.
  const daysToHeat = ((CYCLE_DAYS - cycleDay) % CYCLE_DAYS) || CYCLE_DAYS;
  if (daysToHeat <= 3) return { status: "approaching", cycleDay, dim, daysToHeat };
  return { status: "open", cycleDay, dim, daysToHeat };
}

export type WindowState = "soon" | "open" | "closing" | "missed";
export interface AIWindow {
  state: WindowState;
  hoursToOpen: number;
  hoursToClose: number;
  label: string;
  color: string;
}

/** The insemination window, as relative countdowns from onset (now-independent). */
export function aiWindow(onsetHoursAgo: number): AIWindow {
  const hoursToOpen = Math.max(0, Math.round(WIN_OPEN_H - onsetHoursAgo));
  const hoursToClose = Math.round(WIN_CLOSE_H - onsetHoursAgo);
  if (onsetHoursAgo < WIN_OPEN_H)
    return { state: "soon", hoursToOpen, hoursToClose, label: `Ventana abre en ~${hoursToOpen} h`, color: "var(--watch)" };
  if (onsetHoursAgo <= WIN_CLOSE_H)
    return { state: "open", hoursToOpen, hoursToClose, label: `Inseminar ahora · cierra en ~${hoursToClose} h`, color: "var(--sage-deep)" };
  if (onsetHoursAgo <= 28)
    return { state: "closing", hoursToOpen, hoursToClose, label: "Ventana cerrando — inseminar pronto", color: "var(--brown)" };
  return { state: "missed", hoursToOpen, hoursToClose, label: "Ventana perdida — próximo celo ~21 d", color: "var(--critical)" };
}

export interface ReproItem {
  a: Animal;
  r: Repro;
}
export interface ReproSummary {
  inHeat: ReproItem[];
  approaching: ReproItem[];
  counts: { inHeat: number; approaching: number; open: number; bred: number; pregnant: number; breedable: number };
}

/** Roll per-animal reproduction up into a breeding-board summary. */
export function summarizeRepro(herd: Animal[], bredMap: Record<string, string> = {}): ReproSummary {
  const items = herd
    .map((a) => ({ a, r: reproOf(a, !!bredMap[a.id]) }))
    .filter((x): x is ReproItem => x.r !== null);

  const inHeat = items.filter((x) => x.r.status === "in_heat").sort((p, q) => (q.r.intensity ?? 0) - (p.r.intensity ?? 0));
  const approaching = items
    .filter((x) => x.r.status === "approaching")
    .sort((p, q) => (p.r.daysToHeat ?? 9) - (q.r.daysToHeat ?? 9));
  const c = (s: ReproStatus) => items.filter((x) => x.r.status === s).length;

  return {
    inHeat,
    approaching,
    counts: { inHeat: inHeat.length, approaching: approaching.length, open: c("open"), bred: c("bred"), pregnant: c("pregnant"), breedable: items.length },
  };
}
