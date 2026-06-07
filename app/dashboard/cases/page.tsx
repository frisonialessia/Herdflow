"use client";

// Cases inbox — the vet / herdsman worklist. Every non-healthy animal as a
// triage queue: condition, severity, predictive lead-time, who owns it and what
// stage it's at, with one-tap "advance" actions. Click a row for the full case.

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { SPECIES_EMOJI, SPECIES_LABEL, CaseStatus, Animal } from "@/lib/types";
import { STATUS_LABEL, timeAgo } from "@/lib/format";
import { inferCondition } from "@/lib/conditions";
import { analyzeForecast } from "@/lib/forecast";
import { Check, ChevronRight, RotateCcw, Zap, ClipboardList } from "lucide-react";

const fmtH = (h: number) => (h >= 48 ? `${Math.round(h / 24)}d` : `${h}h`);

const CASE_LABEL: Record<CaseStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  treating: "Treating",
  resolved: "Resolved",
};
const CASE_COLOR: Record<CaseStatus, string> = {
  open: "var(--critical)",
  acknowledged: "var(--brown)",
  treating: "var(--sage-deep)",
  resolved: "var(--healthy)",
};
const NEXT: Record<CaseStatus, { label: string; to: CaseStatus } | null> = {
  open: { label: "Acknowledge", to: "acknowledged" },
  acknowledged: { label: "Start treatment", to: "treating" },
  treating: { label: "Resolve", to: "resolved" },
  resolved: null,
};

const SEV = { critical: 0, watch: 1, healthy: 2 } as const;
const TABS: { key: CaseStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "treating", label: "Treating" },
  { key: "resolved", label: "Resolved" },
];

export default function CasesPage() {
  const { herd, caseFor, advanceCase, selectAnimal } = useHerd();
  const [tab, setTab] = useState<CaseStatus | "all">("all");

  const all = herd.filter((a) => a.status !== "healthy");
  const countFor = (k: CaseStatus | "all") =>
    k === "all" ? all.length : all.filter((a) => caseFor(a.id).status === k).length;

  const shown = all
    .filter((a) => tab === "all" || caseFor(a.id).status === tab)
    .sort((x, y) => {
      const xr = caseFor(x.id).status === "resolved" ? 1 : 0;
      const yr = caseFor(y.id).status === "resolved" ? 1 : 0;
      return xr - yr || SEV[x.status] - SEV[y.status] || Math.abs(y.deviation.z_score) - Math.abs(x.deviation.z_score);
    });

  const openCount = all.filter((a) => caseFor(a.id).status !== "resolved").length;

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
            <ClipboardList size={24} strokeWidth={2} color="var(--sage-deep)" /> Cases
          </h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {openCount} open · {all.length - openCount} resolved
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="rounded-xl px-3.5 py-2 text-[13px] cursor-pointer border flex items-center gap-2"
              style={active ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" } : { background: "var(--card-soft)", borderColor: "var(--border)" }}
            >
              {t.label}
              <span
                className="rounded-[20px] px-1.5 text-[11px] font-semibold"
                style={active ? { background: "rgba(255,255,255,0.22)" } : { background: "var(--border)", color: "var(--muted)" }}
              >
                {countFor(t.key)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        {shown.map((a) => (
          <CaseRow key={a.id} animal={a} status={caseFor(a.id).status} assignee={caseFor(a.id).assignee} onOpen={() => selectAnimal(a.id)} onAdvance={advanceCase} />
        ))}
        {shown.length === 0 && (
          <div className="bg-white border rounded-xl2 text-center text-sm py-12" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            No cases in this view — every animal here is handled.
          </div>
        )}
      </div>
    </section>
  );
}

function CaseRow({
  animal: a,
  status,
  assignee,
  onOpen,
  onAdvance,
}: {
  animal: Animal;
  status: CaseStatus;
  assignee: string | null;
  onOpen: () => void;
  onAdvance: (id: string, to: CaseStatus) => void;
}) {
  const cond = inferCondition(a);
  const f = analyzeForecast(a);
  const sevColor = a.status === "critical" ? "var(--critical)" : "var(--watch)";
  const next = NEXT[status];

  let lead: string | null = null;
  if (f) {
    if (f.alreadyCritical) {
      const h = f.hoursFlagToCritical && f.hoursFlagToCritical > 0 ? f.hoursFlagToCritical : f.hoursSinceFlag;
      if (h && h > 0) lead = `${fmtH(h)} early`;
    } else if (f.projectionHours) lead = `→ crit ~${fmtH(f.projectionHours)}`;
  }

  return (
    <div
      onClick={onOpen}
      className="bg-white border rounded-[16px] p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="w-1 self-stretch min-h-[38px] rounded-full shrink-0" style={{ background: sevColor }} />
        <div className="w-[40px] h-[40px] rounded-[11px] flex items-center justify-center text-[20px] shrink-0" style={{ background: "var(--card-soft)" }}>
          {SPECIES_EMOJI[a.species]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[15px]">{a.name}</span>
            <span className="text-xs" style={{ color: "var(--faint)" }}>{a.tag_id} · {SPECIES_LABEL[a.species]}</span>
            <span className="text-[10.5px] font-semibold px-2 py-[2px] rounded-[20px] uppercase tracking-wide text-white" style={{ background: sevColor }}>
              {STATUS_LABEL[a.status]}
            </span>
            {lead && (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-[2px] rounded-[20px] text-white" style={{ background: "var(--sage-deep)" }}>
                <Zap size={11} strokeWidth={2.4} color="#fff" /> {lead}
              </span>
            )}
          </div>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {cond.label} · <span style={{ color: "var(--ink)" }}>{assignee ?? "Unassigned"}</span> · {timeAgo(a.latest.recorded_at)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 pl-[52px] sm:pl-0">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-[20px] whitespace-nowrap" style={{ background: "var(--card-soft)", color: CASE_COLOR[status], border: `1px solid ${CASE_COLOR[status]}` }}>
          {CASE_LABEL[status]}
        </span>
        {next ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(a.id, next.to); }}
            className="flex items-center gap-1.5 text-white border-0 rounded-[20px] px-3.5 py-2 text-[12.5px] font-medium cursor-pointer whitespace-nowrap"
            style={{ background: "var(--sage-deep)" }}
          >
            {next.label} <ChevronRight size={14} strokeWidth={2.4} color="#fff" />
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium whitespace-nowrap" style={{ color: "var(--healthy)" }}>
            <Check size={15} strokeWidth={2.6} /> Resolved
          </span>
        )}
      </div>
    </div>
  );
}
