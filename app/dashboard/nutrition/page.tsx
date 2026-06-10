"use client";

import { EmptyState } from "@/components/EmptyState";

// Nutrition board — feed management. The herd feed index, average intake vs
// target and rumination, body-condition spread, and the off-feed / dipping
// worklist (worst first) for a feed or vet check.

import { useMemo } from "react";
import { useHerd } from "@/components/HerdProvider";
import { SPECIES_EMOJI, SPECIES_LABEL } from "@/lib/types";
import { summarizeNutrition, FEED_META, NutritionItem } from "@/lib/nutrition";
import { Wheat, Utensils } from "lucide-react";

export default function NutritionPage() {
  const { herd, selectAnimal } = useHerd();
  const { offFeed, avgIntakePct, avgRumPct, index, bcs, total } = useMemo(() => summarizeNutrition(herd), [herd]);
  const offCount = offFeed.filter((x) => x.n.status === "off_feed").length;

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
            <Wheat size={24} strokeWidth={2} color="var(--sage-deep)" /> Nutrición
          </h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {offCount} inapetentes · {offFeed.length - offCount} bajando · {total} animales
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr_1fr] gap-[18px] mb-6">
        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Índice de alimentación del hato</div>
          <div className="font-sora text-[40px] font-semibold mt-1" style={{ color: index >= 90 ? "var(--healthy)" : index >= 80 ? "var(--watch)" : "var(--critical)" }}>{index}%</div>
          <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>comiendo (no inapetentes)</div>
        </div>

        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Promedio vs objetivo</div>
          <Meter label="Consumo de materia seca" pct={avgIntakePct} icon={<Utensils size={15} strokeWidth={2} color="var(--brown)" />} />
          <div className="mt-3">
            <Meter label="Rumia (rumiantes)" pct={avgRumPct} icon={<Wheat size={15} strokeWidth={2} color="var(--brown)" />} />
          </div>
        </div>

        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Condición corporal (BCS)</div>
          <div className="flex h-3 rounded-full overflow-hidden mb-3" style={{ background: "var(--card-soft)" }}>
            <Seg n={bcs.thin} total={total} color="var(--watch)" />
            <Seg n={bcs.ideal} total={total} color="var(--healthy)" />
            <Seg n={bcs.over} total={total} color="var(--brown)" />
          </div>
          <div className="flex justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
            <span><b style={{ color: "var(--ink)" }}>{bcs.thin}</b> delgada</span>
            <span><b style={{ color: "var(--ink)" }}>{bcs.ideal}</b> ideal</span>
            <span><b style={{ color: "var(--ink)" }}>{bcs.over}</b> sobrepeso</span>
          </div>
        </div>
      </div>

      <h3 className="font-sora text-[17px] font-semibold flex items-center gap-2.5 mb-3.5">
        Vigilancia de inapetencia
        <span className="text-white rounded-[20px] px-2.5 text-[13px] font-semibold" style={{ background: "var(--brown)" }}>{offFeed.length}</span>
      </h3>

      {offFeed.length === 0 ? (
        <EmptyState title="Todo el hato come bien" subtitle="Consumo y rumia dentro del objetivo." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {offFeed.map((it) => (
            <FeedRow key={it.a.id} item={it} onOpen={() => selectAnimal(it.a.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeedRow({ item, onOpen }: { item: NutritionItem; onOpen: () => void }) {
  const { a, n } = item;
  const meta = FEED_META[n.status];
  return (
    <div
      onClick={onOpen}
      className="bg-white border rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderColor: n.status === "off_feed" ? meta.color : "var(--border)" }}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
      <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[21px] shrink-0" style={{ background: "var(--card-soft)" }}>
        {SPECIES_EMOJI[a.species]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[15px]">{a.name}</span>
          <span className="text-xs" style={{ color: "var(--faint)" }}>{a.tag_id} · {SPECIES_LABEL[a.species]} · BCS {n.bcs}</span>
          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-[2px] rounded-[20px] text-white" style={{ background: meta.color }}>{meta.short}</span>
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>{meta.note}</div>
      </div>
      </div>
      <div className="shrink-0 w-full sm:w-[150px] flex flex-col gap-1.5 pl-[56px] sm:pl-0">
        <Meter label="Consumo" pct={n.intakePct} small />
        {n.rumPct !== null && <Meter label="Rumia" pct={n.rumPct} small />}
      </div>
    </div>
  );
}

function Meter({ label, pct, icon, small }: { label: string; pct: number; icon?: React.ReactNode; small?: boolean }) {
  const color = pct >= 90 ? "var(--healthy)" : pct >= 80 ? "var(--watch)" : "var(--critical)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`flex items-center gap-1.5 ${small ? "text-[11px]" : "text-[12.5px]"}`} style={{ color: "var(--muted)" }}>{icon}{label}</span>
        <span className={`font-sora font-semibold tabular-nums ${small ? "text-[12px]" : "text-[14px]"}`} style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

function Seg({ n, total, color }: { n: number; total: number; color: string }) {
  if (n === 0) return null;
  return <div style={{ width: `${(n / total) * 100}%`, background: color }} title={`${n}`} />;
}
