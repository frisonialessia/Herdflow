"use client";

// Unified per-animal history (the "expediente") — one chronological feed merging
// the husbandry record (birth, vaccines, antecedents), the live signal (flagged /
// critical), the case log, breeding, and the persisted platform log (enrollment,
// edits). Always goes back to when the animal entered the platform.

import { Animal } from "@/lib/types";
import { useHerd } from "@/components/HerdProvider";
import { buildHistory, HISTORY_COLOR, HistoryKind } from "@/lib/history";
import { Sparkles, Syringe, Stethoscope, AlertTriangle, ClipboardList, HeartPulse, History, Pencil, Camera, ScanSearch, LucideIcon } from "lucide-react";

const ICON: Record<HistoryKind, LucideIcon> = {
  enrolled: History,
  edit: Pencil,
  birth: Sparkles,
  vaccine: Syringe,
  medical: Stethoscope,
  watch: AlertTriangle,
  critical: AlertTriangle,
  case: ClipboardList,
  bred: HeartPulse,
  media: Camera,
  ai: ScanSearch,
};

const fmtDate = (at: string | null) => (at ? new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");

export function HistoryTimeline({ animal: a }: { animal: Animal }) {
  const { caseFor, bred, log } = useHerd();
  const events = buildHistory(a, caseFor(a.id).events, bred[a.id] ?? null, log[a.id] ?? []);
  if (events.length === 0) return null;

  return (
    <div className="bg-white border rounded-[14px] p-4 mb-5 shadow-[0_6px_20px_-14px_rgba(58,90,64,0.16)]" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-3.5">
        <History size={16} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>Historial</h3>
        <span className="ml-auto text-[12px]" style={{ color: "var(--faint)" }}>{events.length} eventos</span>
      </div>

      <div className="flex flex-col">
        {events.map((e, i) => {
          const Icon = ICON[e.kind];
          const last = i === events.length - 1;
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0" style={{ background: HISTORY_COLOR[e.kind] }}>
                  <Icon size={13} strokeWidth={2.2} color="#fff" />
                </span>
                {!last && <span className="w-[2px] flex-1 my-1 rounded" style={{ background: "var(--border)" }} />}
              </div>
              <div className={last ? "" : "pb-4"}>
                <div className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{e.title}</div>
                {e.detail && <div className="text-[12px] mt-0.5 leading-snug" style={{ color: "var(--muted)" }}>{e.detail}</div>}
                <div className="text-[11px] mt-0.5" style={{ color: "var(--faint)" }}>{fmtDate(e.at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
