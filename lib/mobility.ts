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
  0: { short: "Buena", label: "Buena movilidad", color: "var(--healthy)", note: "Camina parejo en las cuatro patas." },
  1: { short: "Imperfecta", label: "Movilidad imperfecta", color: "var(--watch)", note: "Andar ligeramente disparejo — vigilar y revisar en el próximo recorte." },
  2: { short: "Comprometida", label: "Comprometida — coja", color: "var(--brown)", note: "Coja de un miembro. Revisar la pata y recortar/tratar pronto." },
  3: { short: "Severa", label: "Cojera severa", color: "var(--critical)", note: "Cojera severa — revisión urgente de pata, analgesia y reducir caminata." },
};

export function mobilityOf(a: Animal): Mobility | null {
  if (!isHooved(a)) return null;

  // Chronic baseline: a realistic herd mobility spread (~70% sound, ~20% slightly
  // off, ~10% lame), seeded per animal so it's stable.
  const seeded = hash01(a.id + "mob");
  const chronic: MobScore = seeded < 0.7 ? 0 : seeded < 0.9 ? 1 : seeded < 0.97 ? 2 : 3;

  // Acute: a real, sustained downward activity flag. We key off the z-score
  // deviation (which is measured against the animal's own series) rather than the
  // raw latest/baseline ratio — activity is circadian, so a flat comparison would
  // make every animal look lame at night. The drop% comes from the flagged values.
  let acute = 0;
  let drop = 0;
  if (a.deviation.metric === "activity_index" && a.deviation.z_score < 0) {
    acute = a.status === "critical" ? 3 : a.status === "watch" ? 2 : 1;
    if (a.deviation.baseline > 0) drop = Math.max(0, 1 - a.deviation.observed / a.deviation.baseline);
  }

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
