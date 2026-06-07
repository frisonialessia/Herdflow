"use client";

// Biosecurity banner: surfaces outbreak clusters in plain language above the
// map. Appears only when detectOutbreaks finds a group; clicking opens the
// first animal of the cluster so the user can drill in immediately.

import { ShieldAlert, ChevronRight } from "lucide-react";
import type { Outbreak } from "@/lib/outbreak";

export function OutbreakBanner({
  outbreaks,
  onSelect,
}: {
  outbreaks: Outbreak[];
  onSelect: (id: string) => void;
}) {
  if (outbreaks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 mb-[18px]">
      {outbreaks.map((o) => (
        <button
          key={o.id}
          onClick={() => onSelect(o.animalIds[0])}
          className="group w-full text-left relative overflow-hidden rounded-[18px] border p-4 flex items-center gap-3.5 cursor-pointer transition-shadow hover:shadow-lg"
          style={{ borderColor: "var(--critical)", background: "linear-gradient(100deg,#f6ece4 0%,#ffffff 70%)" }}
        >
          <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: "var(--critical)" }} />
          <span
            className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
            style={{ background: "var(--critical)" }}
          >
            <ShieldAlert size={22} strokeWidth={2} color="#fff" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-[3px] rounded-[20px] text-white" style={{ background: "var(--critical)" }}>
                Posible brote
              </span>
              <span className="font-sora text-[15px] font-semibold">
                {o.label} · {o.paddock}
              </span>
              <span className="text-[12px] font-semibold px-2 py-[2px] rounded-[20px]" style={{ background: "var(--brown-soft)", color: "var(--brown)" }}>
                {o.size} animales{o.criticalCount > 0 ? ` · ${o.criticalCount} críticos` : ""}
              </span>
            </div>
            <div className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
              {o.note}
            </div>
          </div>
          <span className="flex items-center gap-1 text-[13px] font-medium shrink-0 self-center" style={{ color: "var(--critical)" }}>
            Revisar <ChevronRight size={16} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
