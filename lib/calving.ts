// Calving layer — closes the reproductive loop (bred → pregnant → calving).
//
// Every confirmed-pregnant female has an expected calving date set by her
// species' gestation length. The weeks around calving are the highest-risk,
// highest-value window of the whole cycle: cows need to be moved to a maternity
// pen and dried off on time, and overdue or imminent calvings need eyes on them.
//
// Built on top of lib/repro.ts (only "pregnant" cows calve) and, like it, pure
// and now-independent: progress through gestation is seeded per animal, so the
// days-to-calving countdown is deterministic. Absolute dates are layered on in
// the UI (the dashboard renders client-side only, so wall-clock use is safe).

import { Animal, Species } from "./types";
import { isBreedable, reproOf, hash01 } from "./repro";

// Mean gestation length (days). Only the breedable ruminants calve here.
export const GESTATION: Record<Species, number> = { dairy: 283, beef: 285, sheep: 147, horse: 340, poultry: 0 };

export type CalvingBucket = "overdue" | "imminent" | "due_soon" | "carrying";

export interface Calving {
  gestation: number; // species gestation length
  gestationDay: number; // days carried so far
  daysToCalving: number; // may be negative (overdue)
  bucket: CalvingBucket;
}

export function calvingOf(a: Animal): Calving | null {
  if (!isBreedable(a)) return null;
  const r = reproOf(a);
  if (!r || r.status !== "pregnant") return null;

  const g = GESTATION[a.species];
  // ~28% of pregnant cows are "close-up" (due within ~3 weeks, some overdue) so
  // the calving watch is meaningfully populated; the rest are mid-gestation.
  let daysToCalving: number;
  if (hash01(a.id + "due") < 0.28) {
    daysToCalving = Math.round(-5 + hash01(a.id + "dd") * 26); // -5..21
  } else {
    daysToCalving = Math.round(28 + hash01(a.id + "dd") * (g - 28)); // 28..g
  }
  const gestationDay = Math.max(1, Math.min(g, g - daysToCalving));
  const bucket: CalvingBucket =
    daysToCalving < 0 ? "overdue" : daysToCalving <= 3 ? "imminent" : daysToCalving <= 21 ? "due_soon" : "carrying";

  return { gestation: g, gestationDay, daysToCalving, bucket };
}

export interface CalvingItem {
  a: Animal;
  c: Calving;
}
export interface CalvingSummary {
  watch: CalvingItem[]; // overdue + imminent + due_soon, soonest first
  counts: { overdue: number; imminent: number; dueSoon: number; carrying: number; pregnant: number };
}

export function summarizeCalving(herd: Animal[]): CalvingSummary {
  const items = herd.map((a) => ({ a, c: calvingOf(a) })).filter((x): x is CalvingItem => x.c !== null);
  const watch = items.filter((x) => x.c.bucket !== "carrying").sort((p, q) => p.c.daysToCalving - q.c.daysToCalving);
  const cnt = (b: CalvingBucket) => items.filter((x) => x.c.bucket === b).length;
  return {
    watch,
    counts: { overdue: cnt("overdue"), imminent: cnt("imminent"), dueSoon: cnt("due_soon"), carrying: cnt("carrying"), pregnant: items.length },
  };
}

export const BUCKET_COLOR: Record<CalvingBucket, string> = {
  overdue: "var(--critical)",
  imminent: "var(--brown)",
  due_soon: "var(--watch)",
  carrying: "var(--healthy)",
};
export const BUCKET_LABEL: Record<CalvingBucket, string> = {
  overdue: "Overdue",
  imminent: "Imminent",
  due_soon: "Due soon",
  carrying: "Carrying",
};

/** "Due in ~12 d" / "Calving today" / "Overdue 2 d". */
export function calvingLabel(daysToCalving: number): string {
  if (daysToCalving < 0) return `Overdue ${-daysToCalving} d`;
  if (daysToCalving === 0) return "Calving today";
  return `Due in ~${daysToCalving} d`;
}
