"use client";

// Reproduction card in the animal drawer (breedable females only). Shows where
// she is in her cycle and — when she's in standing heat — the insemination
// window with a one-tap "Mark bred". Mirrors the breeding board, scoped to one
// animal.

import { useHerd } from "@/components/HerdProvider";
import { Animal } from "@/lib/types";
import { reproOf, aiWindow, isBreedable } from "@/lib/repro";
import { calvingOf, calvingLabel, BUCKET_COLOR } from "@/lib/calving";
import { HeartPulse, Syringe, CalendarDays, Check, CircleDot } from "lucide-react";

export function ReproCard({ animal: a }: { animal: Animal }) {
  const { bred, markBred } = useHerd();
  if (!isBreedable(a)) return null;
  const justBred = !!bred[a.id];
  const r = reproOf(a, justBred);
  if (!r) return null;

  const Shell = ({ accent, children }: { accent: string; children: React.ReactNode }) => (
    <div className="rounded-[14px] p-4 mb-5" style={{ background: "var(--card)", border: `1px solid ${accent}` }}>
      <div className="flex items-center gap-2 mb-2">
        <HeartPulse size={16} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>Reproduction</h3>
        <span className="ml-auto text-[12px]" style={{ color: "var(--faint)" }}>{r.dim} DIM</span>
      </div>
      {children}
    </div>
  );

  if (r.status === "in_heat") {
    const win = aiWindow(r.onsetHoursAgo ?? 6);
    return (
      <Shell accent="var(--sage)">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-[3px] rounded-[20px] text-white" style={{ background: "var(--sage-deep)" }}>
            <HeartPulse size={12} strokeWidth={2.4} color="#fff" /> In heat
          </span>
          <span className="text-[12px] font-semibold px-2 py-[2px] rounded-[20px]" style={{ background: "var(--card-soft)", color: "var(--muted)" }}>
            {r.confidence} confidence · {r.detectedBy === "activity" ? "activity spike" : "cycle"}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full" style={{ width: `${r.intensity ?? 0}%`, background: "var(--sage-deep)" }} />
          </div>
          <span className="font-sora text-[13px] font-semibold tabular-nums">{r.intensity}</span>
        </div>
        <div className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
          Onset ~{r.onsetHoursAgo} h ago · <span style={{ color: win.color, fontWeight: 600 }}>{win.label}</span>
        </div>
        <button
          onClick={() => markBred(a.id)}
          className="w-full flex items-center justify-center gap-2 text-white border-0 rounded-[12px] py-2.5 text-[13px] font-medium cursor-pointer"
          style={{ background: "var(--sage-deep)" }}
        >
          <Syringe size={15} strokeWidth={2.2} color="#fff" /> Mark bred
        </button>
      </Shell>
    );
  }

  if (r.status === "bred") {
    return (
      <Shell accent="var(--brown-soft)">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Check size={16} strokeWidth={2.4} color="var(--sage-deep)" />
          {justBred ? "Marked bred" : "Bred"} · confirm pregnancy in ~30 d
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>Schedule a pregnancy check; watch for a return to heat at ~21 days.</div>
      </Shell>
    );
  }

  if (r.status === "approaching") {
    return (
      <Shell accent="var(--watch)">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <CalendarDays size={16} strokeWidth={2.2} color="var(--brown)" />
          Approaching heat — expected in ~{r.daysToHeat} d
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>Watch for standing heat and rising activity over the next 48 hours.</div>
      </Shell>
    );
  }

  if (r.status === "pregnant") {
    const c = calvingOf(a);
    return (
      <Shell accent="var(--brown-soft)">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Check size={16} strokeWidth={2.4} color="var(--healthy)" /> Confirmed pregnant
        </div>
        {c ? (
          <>
            <div className="flex items-center gap-2.5 mt-2.5">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round((c.gestationDay / c.gestation) * 100)}%`, background: BUCKET_COLOR[c.bucket] }} />
              </div>
              <span className="text-[12px] tabular-nums" style={{ color: "var(--muted)" }}>day {c.gestationDay}/{c.gestation}</span>
            </div>
            <div className="text-[12.5px] mt-1.5" style={{ color: "var(--muted)" }}>
              <span style={{ color: BUCKET_COLOR[c.bucket], fontWeight: 600 }}>{calvingLabel(c.daysToCalving)}</span> · expected calving
            </div>
          </>
        ) : (
          <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>No action — not expected to cycle.</div>
        )}
      </Shell>
    );
  }

  // open
  return (
    <Shell accent="var(--border)">
      <div className="flex items-center gap-2 text-[14px] font-semibold">
        <CircleDot size={15} strokeWidth={2.2} color="var(--muted)" /> Open · cycling
      </div>
      <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>Next heat expected in ~{r.daysToHeat} d (≈21-day cycle).</div>
    </Shell>
  );
}
