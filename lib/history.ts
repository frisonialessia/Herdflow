// Per-animal history — the unified "expediente": every dated event for an animal
// in one chronological feed. Pulls from the husbandry record (birth, vaccines,
// medical antecedents), the live signal (when it was first flagged / went
// critical), the case log, and breeding actions.
//
// Only real dates are used; anything genuinely undated sorts to the end.

import { Animal, CaseEvent } from "./types";
import { profileFor, SEX_LABEL } from "./profile";
import { analyzeForecast } from "./forecast";
import { METRIC_LABEL } from "./format";

export type HistoryKind = "enrolled" | "edit" | "birth" | "vaccine" | "medical" | "watch" | "critical" | "case" | "bred";

export interface HistoryEvent {
  at: string | null; // ISO date, or null if undated
  kind: HistoryKind;
  title: string;
  detail?: string;
}

// A persisted log entry (accumulated live as the user acts, kept in the provider
// for the session — to be scaled to a DB later).
export interface LogEntry {
  at: string; // ISO
  kind: HistoryKind;
  title: string;
  detail?: string;
}

export const HISTORY_COLOR: Record<HistoryKind, string> = {
  enrolled: "var(--sage-deep)",
  edit: "var(--faint)",
  birth: "var(--sage)",
  vaccine: "var(--sage-deep)",
  medical: "var(--brown)",
  watch: "var(--watch)",
  critical: "var(--critical)",
  case: "var(--brown)",
  bred: "var(--sage-deep)",
};

export function buildHistory(a: Animal, caseEvents: CaseEvent[], bredAt: string | null, log: LogEntry[] = []): HistoryEvent[] {
  const p = profileFor(a);
  const ev: HistoryEvent[] = [];

  if (p.birthDate) ev.push({ at: p.birthDate, kind: "birth", title: "Nacimiento", detail: `${p.breed || "—"} · ${SEX_LABEL[p.sex]}` });

  for (const v of p.vaccines) if (v.name) ev.push({ at: v.date || null, kind: "vaccine", title: `Vacuna · ${v.name}` });

  if (p.medicalHistory && p.medicalHistory !== "Sin antecedentes") {
    const yr = p.medicalHistory.match(/(19|20)\d{2}/);
    ev.push({ at: yr ? `${yr[0]}-06-01` : null, kind: "medical", title: "Antecedente médico", detail: p.medicalHistory });
  }

  // Health signal: when the sensor first flagged it, and if/when it went critical.
  const f = analyzeForecast(a);
  if (f?.firstFlagAt) ev.push({ at: f.firstFlagAt, kind: "watch", title: "Marcado en vigilancia", detail: `${METRIC_LABEL[f.metric]} cruzó ±2σ` });
  if (f?.becameCriticalAt) ev.push({ at: f.becameCriticalAt, kind: "critical", title: "Pasó a crítico", detail: `${METRIC_LABEL[f.metric]} ±3σ` });

  for (const c of caseEvents) ev.push({ at: c.at, kind: "case", title: c.label });

  if (bredAt) ev.push({ at: bredAt, kind: "bred", title: "Inseminada (registrada)" });

  // Persisted platform log (enrollment, edits, …) — the part that accumulates
  // from the moment the animal entered the platform.
  for (const l of log) ev.push({ at: l.at, kind: l.kind, title: l.title, detail: l.detail });

  return ev.sort((x, y) => {
    if (x.at && y.at) return new Date(y.at).getTime() - new Date(x.at).getTime();
    if (x.at) return -1;
    if (y.at) return 1;
    return 0;
  });
}
