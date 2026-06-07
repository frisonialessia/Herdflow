// "Today" action center — the capstone that unifies every pillar into the one
// screen a farmer opens each morning: a single, priority-ranked worklist of what
// actually needs doing, pulled from health cases, biosecurity (outbreaks), heat
// stress (THI), breeding (insemination windows) and calving (maternity).
//
// Each source already has its own analyzer; this module just normalizes their
// output into a common ActionItem, assigns an urgency tier, and ranks within it.
// Pure given (herd, cases, bred, now).

import { Animal, CaseState, CaseStatus, SPECIES_LABEL } from "./types";
import { STATUS_LABEL } from "./format";
import { detectOutbreaks } from "./outbreak";
import { inferCondition } from "./conditions";
import { analyzeForecast } from "./forecast";
import { summarizeHeat } from "./heat";
import { summarizeRepro, aiWindow } from "./repro";
import { summarizeCalving, calvingLabel } from "./calving";

export type Domain = "health" | "biosecurity" | "heat" | "breeding" | "calving";
export type Tier = "urgent" | "today" | "upcoming";

export interface ActionItem {
  id: string;
  domain: Domain;
  tier: Tier;
  rank: number; // higher = more urgent within tier
  title: string;
  detail: string;
  cta: string;
  animalId?: string; // click → open the animal drawer
  href?: string; // …or navigate to a board
}

export interface TodayParams {
  herd: Animal[];
  caseFor: (id: string) => CaseState;
  bred: Record<string, string>;
  now: Date;
}

export interface TodayBoard {
  byTier: Record<Tier, ActionItem[]>;
  counts: Record<Tier, number> & { total: number };
  byDomain: Record<Domain, number>;
}

const fmtH = (h: number) => (h >= 48 ? `${Math.round(h / 24)} d` : `${h} h`);
const CASE_LABEL: Record<CaseStatus, string> = { open: "open", acknowledged: "acknowledged", treating: "treating", resolved: "resolved" };

export function buildToday({ herd, caseFor, bred, now }: TodayParams): TodayBoard {
  const items: ActionItem[] = [];

  // ── Biosecurity: outbreak clusters ───────────────────────────────────────
  for (const o of detectOutbreaks(herd)) {
    items.push({
      id: `ob-${o.id}`,
      domain: "biosecurity",
      tier: "urgent",
      rank: 96,
      title: `Possible outbreak · ${o.paddock}`,
      detail: `${o.label} — ${o.size} animals${o.criticalCount > 0 ? ` · ${o.criticalCount} critical` : ""}`,
      cta: "Review",
      animalId: o.animalIds[0],
    });
  }

  // ── Health: non-healthy animals with an active (non-resolved) case ────────
  for (const a of herd) {
    if (a.status === "healthy") continue;
    const cs = caseFor(a.id).status;
    if (cs === "resolved") continue;

    const critical = a.status === "critical";
    const open = cs === "open";
    const f = analyzeForecast(a);
    let lead = "";
    if (f?.alreadyCritical) {
      const hh = f.hoursFlagToCritical && f.hoursFlagToCritical > 0 ? f.hoursFlagToCritical : f.hoursSinceFlag;
      if (hh && hh > 0) lead = ` · flagged ${fmtH(hh)} early`;
    } else if (f?.projectionHours) {
      lead = ` · ~${fmtH(f.projectionHours)} to critical`;
    }

    items.push({
      id: `h-${a.id}`,
      domain: "health",
      tier: critical && open ? "urgent" : "today",
      rank: (critical ? 80 : 48) + (open ? 10 : 0) + Math.min(12, Math.abs(a.deviation.z_score)),
      title: `${a.name} · ${inferCondition(a).short}`,
      detail: `${STATUS_LABEL[a.status]} · case ${CASE_LABEL[cs]}${lead}`,
      cta: "Open",
      animalId: a.id,
    });
  }

  // ── Heat stress: one herd-level action when today's peak is dangerous ─────
  const heat = summarizeHeat(herd, now);
  if (heat.peakBand.key === "danger" || heat.peakBand.key === "emergency") {
    const emergency = heat.peakBand.key === "emergency";
    items.push({
      id: "heat",
      domain: "heat",
      tier: emergency ? "urgent" : "today",
      rank: emergency ? 92 : 58,
      title: `Heat ${emergency ? "emergency" : "danger"} · THI ${Math.round(heat.peak.thi)} at peak`,
      detail: `${heat.atRiskCount} at high risk${heat.topSpecies ? ` · ${SPECIES_LABEL[heat.topSpecies].toLowerCase()} most exposed` : ""} — shade, water & sprinklers at peak`,
      cta: "Plan",
      href: "/dashboard",
      animalId: heat.risks[0]?.animal.id,
    });
  }

  // ── Breeding: cows in heat with an open/closing insemination window ───────
  const repro = summarizeRepro(herd, bred);
  for (const { a, r } of repro.inHeat) {
    const w = aiWindow(r.onsetHoursAgo ?? 6);
    if (w.state === "missed") continue;
    const act = w.state === "open" || w.state === "closing";
    items.push({
      id: `br-${a.id}`,
      domain: "breeding",
      tier: act ? "urgent" : "today",
      rank: 74 - w.hoursToClose,
      title: `Breed ${a.name}`,
      detail: `In heat · ${w.label}`,
      cta: "Breed",
      animalId: a.id,
    });
  }
  for (const { a, r } of repro.approaching) {
    items.push({
      id: `ba-${a.id}`,
      domain: "breeding",
      tier: "upcoming",
      rank: 30 - (r.daysToHeat ?? 2),
      title: `Watch ${a.name} for heat`,
      detail: `Approaching — expected in ~${r.daysToHeat} d`,
      cta: "Open",
      animalId: a.id,
    });
  }

  // ── Calving: the maternity watch list ────────────────────────────────────
  for (const { a, c } of summarizeCalving(herd).watch) {
    const urgent = c.bucket === "overdue" || c.bucket === "imminent";
    items.push({
      id: `cv-${a.id}`,
      domain: "calving",
      tier: urgent ? "urgent" : c.daysToCalving <= 10 ? "today" : "upcoming",
      rank: 84 - c.daysToCalving,
      title: c.bucket === "overdue" ? `Calving overdue · ${a.name}` : `Maternity pen · ${a.name}`,
      detail: `${calvingLabel(c.daysToCalving)} · day ${c.gestationDay}/${c.gestation}`,
      cta: "Open",
      animalId: a.id,
    });
  }

  // ── Group + rank ─────────────────────────────────────────────────────────
  const byTier: Record<Tier, ActionItem[]> = { urgent: [], today: [], upcoming: [] };
  const byDomain: Record<Domain, number> = { health: 0, biosecurity: 0, heat: 0, breeding: 0, calving: 0 };
  for (const it of items) {
    byTier[it.tier].push(it);
    byDomain[it.domain]++;
  }
  (Object.keys(byTier) as Tier[]).forEach((t) => byTier[t].sort((a, b) => b.rank - a.rank));

  return {
    byTier,
    counts: { urgent: byTier.urgent.length, today: byTier.today.length, upcoming: byTier.upcoming.length, total: items.length },
    byDomain,
  };
}
