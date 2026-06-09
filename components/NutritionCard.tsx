"use client";

// Nutrition card in the animal drawer — intake and rumination vs the animal's
// own baseline, body condition, and an off-feed note when relevant.

import { Animal } from "@/lib/types";
import { nutritionOf, FEED_META } from "@/lib/nutrition";
import { Wheat } from "lucide-react";

function Bar({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 90 ? "var(--healthy)" : pct >= 80 ? "var(--watch)" : "var(--critical)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px]" style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-sora text-[13px] font-semibold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

export function NutritionCard({ animal: a }: { animal: Animal }) {
  const n = nutritionOf(a);
  const meta = FEED_META[n.status];
  const flagged = n.status !== "good";

  return (
    <div className="rounded-[14px] p-4 mb-5 shadow-[0_6px_20px_-14px_rgba(58,90,64,0.16)]" style={{ background: "var(--card)", border: `1px solid ${flagged ? meta.color : "var(--border)"}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Wheat size={16} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>Nutrición</h3>
        <span className="ml-auto text-[11px] font-semibold px-2 py-[2px] rounded-[20px]" style={flagged ? { background: meta.color, color: "#fff" } : { background: "var(--card-soft)", color: "var(--muted)" }}>
          {meta.short}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <Bar label="Consumo de materia seca vs línea base" pct={n.intakePct} />
        {n.rumPct !== null && <Bar label="Rumia vs línea base" pct={n.rumPct} />}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>Condición corporal</span>
        <span className="text-[13px] font-semibold">
          BCS {n.bcs}
          <span className="font-normal ml-1.5" style={{ color: n.bcsBand === "ideal" ? "var(--healthy)" : "var(--brown)" }}>· {n.bcsBand}</span>
        </span>
      </div>

      {flagged && <div className="text-[12.5px] mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{meta.note}</div>}
    </div>
  );
}
