"use client";

// Case workflow: turns an alert into something a team actually works. Moves a
// non-healthy animal through open → acknowledged → treating → resolved, with an
// assignee and an activity log. Client-side state for the demo; in DB mode this
// is where anomalies.resolved / alerts.status would be written.

import { useHerd } from "@/components/HerdProvider";
import { CaseStatus } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Check, ChevronRight, RotateCcw, ClipboardList } from "lucide-react";

const STEPS: { key: CaseStatus; label: string }[] = [
  { key: "open", label: "Abierto" },
  { key: "acknowledged", label: "Reconocido" },
  { key: "treating", label: "En tratamiento" },
  { key: "resolved", label: "Resuelto" },
];

const NEXT: Record<CaseStatus, { label: string; to: CaseStatus } | null> = {
  open: { label: "Reconocer", to: "acknowledged" },
  acknowledged: { label: "Iniciar tratamiento", to: "treating" },
  treating: { label: "Marcar resuelto", to: "resolved" },
  resolved: null,
};

const ASSIGNEES = ["Dra. Salas (veterinaria)", "Dr. Romero (veterinario)", "Yo (cuidador)"];

export function CasePanel({ animalId }: { animalId: string }) {
  const { caseFor, advanceCase, assignCase } = useHerd();
  const c = caseFor(animalId);
  const currentIdx = STEPS.findIndex((s) => s.key === c.status);
  const next = NEXT[c.status];
  const events = [...c.events].reverse();

  return (
    <div className="bg-white border rounded-xl2 p-[18px] mb-5 shadow-[0_6px_20px_-14px_rgba(58,90,64,0.16)]" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-sora text-[15px] font-semibold flex items-center gap-2">
          <ClipboardList size={16} strokeWidth={2} color="var(--sage-deep)" /> Caso
        </h3>
        <span
          className="text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px] uppercase tracking-wide"
          style={
            c.status === "resolved"
              ? { background: "var(--healthy)", color: "#fff" }
              : { background: "var(--brown-soft)", color: "var(--brown)" }
          }
        >
          {STEPS[currentIdx].label}
        </span>
      </div>

      {/* Stepper */}
      <div className="flex items-start mb-4">
        {STEPS.map((s, i) => {
          const reached = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={s.key} className="flex-1 flex flex-col items-center relative">
              {i > 0 && (
                <span
                  className="absolute top-[7px] right-1/2 w-full h-[2px]"
                  style={{ background: i <= currentIdx ? "var(--sage-deep)" : "var(--border)" }}
                />
              )}
              <span
                className="relative z-[1] w-4 h-4 rounded-full flex items-center justify-center"
                style={{
                  background: reached ? "var(--sage-deep)" : "#fff",
                  border: `2px solid ${reached ? "var(--sage-deep)" : "var(--border)"}`,
                  boxShadow: isCurrent ? "0 0 0 3px rgba(58,90,64,0.18)" : "none",
                }}
              >
                {reached && <Check size={9} strokeWidth={3.5} color="#fff" />}
              </span>
              <span
                className="text-[10px] mt-1.5 text-center leading-tight"
                style={{ color: reached ? "var(--ink)" : "var(--faint)", fontWeight: isCurrent ? 700 : 500 }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Assignee */}
      <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--faint)" }}>
        Asignado a
      </label>
      <select
        value={c.assignee ?? ""}
        onChange={(e) => assignCase(animalId, e.target.value || null)}
        className="w-full border rounded-xl px-3 py-2.5 mt-1.5 mb-3 text-sm cursor-pointer outline-none"
        style={{ background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
      >
        <option value="">Sin asignar</option>
        {ASSIGNEES.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* Primary action */}
      {next ? (
        <button
          onClick={() => advanceCase(animalId, next.to)}
          className="w-full flex items-center justify-center gap-2 text-white border-0 rounded-xl px-4 py-2.5 text-[13px] font-medium cursor-pointer"
          style={{ background: "var(--sage-deep)" }}
        >
          {next.label} <ChevronRight size={16} strokeWidth={2.2} color="#fff" />
        </button>
      ) : (
        <button
          onClick={() => advanceCase(animalId, "open")}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium cursor-pointer border bg-transparent"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <RotateCcw size={15} strokeWidth={2} /> Reabrir caso
        </button>
      )}

      {/* Activity log */}
      {events.length > 0 && (
        <div className="mt-4 pt-3.5 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "var(--faint)" }}>
            Actividad
          </div>
          <div className="flex flex-col gap-2">
            {events.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sage)" }} />
                  {e.label}
                </span>
                <span style={{ color: "var(--faint)" }}>{timeAgo(e.at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
