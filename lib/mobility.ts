// Mobility & welfare layer — lameness scoring.
//
// Lameness is one of the three biggest welfare and economic problems in dairy
// (lost yield, poor fertility, early culling) and it shows up in the data as a
// drop in activity / mobility — the same signal lib/conditions.ts already labels
// "Lameness?". This module turns that into the industry-standard mobility score
// (0 good → 3 severely lame) per animal, and rolls it up into a herd mobility
// index.
//
// Each score blends a deterministic chronic component (a realistic herd mobility
// distribution, seeded per animal) with the acute, real activity-drop signal —
// so flagged animals jump up the scale honestly. Pure given the herd.

import { Animal, Species } from "./types";
import { hash01 } from "./repro";

export type MobScore = 0 | 1 | 2 | 3;

const HOOVED: Species[] = ["dairy", "beef", "sheep", "horse"];
export const isHooved = (a: Animal) => HOOVED.includes(a.species);

export interface Mobility {
  score: MobScore;
  drop: number; // fraction below the animal's activity baseline (0..1)
  acute: boolean; // driven by a real activity-drop signal (not just chronic)
}

export const MOB_META: Record<MobScore, { short: string; label: string; color: string; note: string }> = {
  0: { short: "Good", label: "Good mobility", color: "var(--healthy)", note: "Walks evenly on all four feet." },
  1: { short: "Imperfect", label: "Imperfect mobility", color: "var(--watch)", note: "Slightly uneven gait — monitor and check at the next trim." },
  2: { short: "Impaired", label: "Impaired — lame", color: "var(--brown)", note: "Lame on one limb. Examine the foot and trim/treat soon." },
  3: { short: "Severe", label: "Severely lame", color: "var(--critical)", note: "Severe lameness — urgent foot exam, pain relief and reduced walking." },
};

export function mobilityOf(a: Animal): Mobility | null {
  if (!isHooved(a)) return null;

  // Chronic baseline: a realistic herd mobility spread (~70% sound, ~20% slightly
  // off, ~10% lame), seeded per animal so it's stable.
  const seeded = hash01(a.id + "mob");
  const chronic: MobScore = seeded < 0.7 ? 0 : seeded < 0.9 ? 1 : seeded < 0.97 ? 2 : 3;

  // Acute: how far current activity sits below the animal's own baseline, plus a
  // bump if its top deviation is a downward activity flag.
  const ratio = a.latest.activity_index / Math.max(1, a.baseline.activity_index);
  const drop = Math.max(0, 1 - ratio);
  let acute = 0;
  if (a.deviation.metric === "activity_index" && a.deviation.z_score < 0) {
    acute = a.status === "critical" ? 3 : a.status === "watch" ? 2 : 1;
  }
  acute = Math.max(acute, drop >= 0.25 ? 3 : drop >= 0.15 ? 2 : drop >= 0.08 ? 1 : 0);

  const score = Math.min(3, Math.max(chronic, acute)) as MobScore;
  return { score, drop, acute: acute >= 2 };
}

export interface MobilityItem {
  a: Animal;
  m: Mobility;
}
export interface MobilitySummary {
  lame: MobilityItem[]; // score >= 2, worst first
  dist: Record<MobScore, number>;
  index: number; // % of hooved animals scoring 0–1 (the herd mobility KPI)
  total: number;
}

export function summarizeMobility(herd: Animal[]): MobilitySummary {
  const items = herd.map((a) => ({ a, m: mobilityOf(a) })).filter((x): x is MobilityItem => x.m !== null);
  const dist: Record<MobScore, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const it of items) dist[it.m.score]++;
  const lame = items.filter((x) => x.m.score >= 2).sort((p, q) => q.m.score - p.m.score || q.m.drop - p.m.drop);
  const sound = dist[0] + dist[1];
  return { lame, dist, index: items.length ? Math.round((sound / items.length) * 100) : 100, total: items.length };
}
