"use client";

// Mobility card in the animal drawer (hooved animals). Shows the locomotion
// score (0 good → 3 severely lame) on a visual scale, what it means, and how far
// current activity sits below the animal's baseline.

import { Animal } from "@/lib/types";
import { mobilityOf, isHooved, MOB_META, MobScore } from "@/lib/mobility";
import { Footprints } from "lucide-react";

export function MobilityScale({ score }: { score: MobScore }) {
  return (
    <div className="flex gap-1 items-center">
      {[0, 1, 2, 3].map((n) => (
        <span key={n} className="w-6 h-1.5 rounded-full" style={{ background: n <= score ? MOB_META[score].color : "var(--border)" }} />
      ))}
    </div>
  );
}

export function MobilityCard({ animal: a }: { animal: Animal }) {
  if (!isHooved(a)) return null;
  const m = mobilityOf(a);
  if (!m) return null;
  const meta = MOB_META[m.score];

  return (
    <div className="rounded-[14px] p-4 mb-5" style={{ background: "var(--card)", border: `1px solid ${m.score >= 2 ? meta.color : "var(--border)"}` }}>
      <div className="flex items-center gap-2 mb-2.5">
        <Footprints size={16} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>Mobility</h3>
        <span className="ml-auto text-[11px] font-semibold px-2 py-[2px] rounded-[20px] text-white" style={{ background: meta.color }}>
          Score {m.score} · {meta.short}
        </span>
      </div>
      <div className="flex items-center gap-2.5 mb-2">
        <MobilityScale score={m.score} />
        <span className="text-[12px]" style={{ color: "var(--muted)" }}>0–3 locomotion</span>
        {m.drop >= 0.05 && (
          <span className="ml-auto text-[12px] font-semibold" style={{ color: meta.color }}>activity −{Math.round(m.drop * 100)}%</span>
        )}
      </div>
      <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{meta.note}</div>
    </div>
  );
}
