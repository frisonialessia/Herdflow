// Nutrition layer — feed intake, rumination and body condition.
//
// Off-feed is one of the earliest, most general signs that something is wrong
// (illness, ketosis, ration or water problems), and it shows up directly in two
// metrics we already track: dry-matter intake and rumination time. This module
// scores each animal's feeding against its own baseline, flags off-feed/dipping
// animals, and tracks body condition (BCS) — the standard nutrition KPI.
//
// Intake/rumination scoring is data-driven (vs. each animal's baseline); BCS is
// a seeded herd distribution. Pure given the herd.

import { Animal, Species } from "./types";
import { hash01 } from "./repro";

// Ruminate by species — non-ruminant baselines carry tiny rumination noise, so
// the baseline value itself can't be used to decide who chews cud.
const RUMINANTS: Species[] = ["dairy", "beef", "sheep"];

export type FeedStatus = "good" | "watch" | "off_feed";

export interface Nutrition {
  intakeRatio: number; // latest / baseline
  intakePct: number; // rounded %
  ruminant: boolean;
  rumPct: number | null; // rumination % of baseline (ruminants)
  status: FeedStatus;
  drop: number; // worst of intake/rumination drop, for ranking
  bcs: number; // body condition score (1–5)
  bcsBand: "thin" | "ideal" | "over";
}

export const FEED_META: Record<FeedStatus, { short: string; label: string; color: string; note: string }> = {
  good: { short: "On feed", label: "On feed", color: "var(--healthy)", note: "Intake and rumination on target." },
  watch: { short: "Dipping", label: "Intake dipping", color: "var(--watch)", note: "Slipping below target — check feed access, water and ration." },
  off_feed: { short: "Off-feed", label: "Off-feed", color: "var(--critical)", note: "Well below target — check for illness, ketosis or a ration problem." },
};

export function nutritionOf(a: Animal): Nutrition {
  const ruminant = RUMINANTS.includes(a.species);
  const dataIntake = a.baseline.intake_kg > 0 ? a.latest.intake_kg / a.baseline.intake_kg : 1;
  const dataRum = ruminant ? a.latest.rumination_min / Math.max(1, a.baseline.rumination_min) : null;

  // Seeded persistent feed status: most animals on target, some chronic dippers
  // and a few off-feed (fresh cows, poor doers, subclinical illness) — blended
  // with the live intake/rumination so the displayed % stays consistent.
  const fh = hash01(a.id + "feed");
  let seededFactor = 1;
  if (fh < 0.06) seededFactor = +(0.62 + hash01(a.id + "f2") * 0.16).toFixed(2); // off-feed (0.62–0.78)
  else if (fh < 0.18) seededFactor = +(0.84 + hash01(a.id + "f2") * 0.08).toFixed(2); // dipping (0.84–0.92)

  const intakeRatio = Math.min(dataIntake, seededFactor);
  const rumRatio = dataRum !== null ? Math.min(dataRum, seededFactor < 1 ? seededFactor + 0.08 : 1.5) : null;
  const intakeDrop = Math.max(0, 1 - intakeRatio);
  const rumDrop = rumRatio !== null ? Math.max(0, 1 - rumRatio) : 0;
  const drop = Math.max(intakeDrop, rumDrop);

  const flaggedDown = (a.deviation.metric === "intake_kg" || a.deviation.metric === "rumination_min") && a.deviation.z_score < 0 && a.status !== "healthy";

  let status: FeedStatus = "good";
  if (intakeDrop >= 0.18 || rumDrop >= 0.2 || (flaggedDown && a.status === "critical")) status = "off_feed";
  else if (intakeDrop >= 0.12 || rumDrop >= 0.14 || flaggedDown) status = "watch";

  // Body condition (seeded, center-weighted so most of the herd is ideal).
  const m = (hash01(a.id + "bcs") + hash01(a.id + "bcs2")) / 2;
  const bcs = +(2.4 + m * 1.4).toFixed(2); // ~2.4–3.8, peak ~3.1
  const bcsBand = bcs < 2.75 ? "thin" : bcs > 3.5 ? "over" : "ideal";

  return { intakeRatio, intakePct: Math.round(intakeRatio * 100), ruminant, rumPct: rumRatio !== null ? Math.round(rumRatio * 100) : null, status, drop, bcs, bcsBand };
}

export interface NutritionItem {
  a: Animal;
  n: Nutrition;
}
export interface NutritionSummary {
  offFeed: NutritionItem[]; // status !== good, worst first
  avgIntakePct: number;
  avgRumPct: number;
  index: number; // % on feed (status good)
  bcs: { thin: number; ideal: number; over: number };
  total: number;
}

const STATUS_WEIGHT: Record<FeedStatus, number> = { good: 0, watch: 1, off_feed: 2 };

export function summarizeNutrition(herd: Animal[]): NutritionSummary {
  const items = herd.map((a) => ({ a, n: nutritionOf(a) }));
  if (items.length === 0) return { offFeed: [], avgIntakePct: 100, avgRumPct: 100, index: 100, bcs: { thin: 0, ideal: 0, over: 0 }, total: 0 };

  const offFeed = items
    .filter((x) => x.n.status !== "good")
    .sort((p, q) => STATUS_WEIGHT[q.n.status] - STATUS_WEIGHT[p.n.status] || q.n.drop - p.n.drop);

  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, v) => s + v, 0) / xs.length) : 0);
  const onFeed = items.filter((x) => x.n.status !== "off_feed").length; // off-feed is the real problem; watch is minor
  const bcs = { thin: 0, ideal: 0, over: 0 };
  for (const x of items) bcs[x.n.bcsBand]++;

  return {
    offFeed,
    avgIntakePct: avg(items.map((x) => x.n.intakePct)),
    avgRumPct: avg(items.filter((x) => x.n.rumPct !== null).map((x) => x.n.rumPct as number)),
    index: Math.round((onFeed / items.length) * 100),
    bcs,
    total: items.length,
  };
}
