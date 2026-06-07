"use client";

// Calving board — the maternity worklist. Confirmed-pregnant cows ranked by how
// close they are to calving: overdue and imminent first (move to the maternity
// pen, watch closely), then due within three weeks, with each cow's progress
// through gestation and her expected calving date.

import { useMemo } from "react";
import { useHerd } from "@/components/HerdProvider";
import { SPECIES_EMOJI, SPECIES_LABEL } from "@/lib/types";
import { summarizeCalving, calvingLabel, BUCKET_COLOR, BUCKET_LABEL, CalvingItem } from "@/lib/calving";
import { Baby, CalendarDays } from "lucide-react";

const fmtDate = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * 86_400_000).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function CalvingPage() {
  const { herd, selectAnimal } = useHerd();
  const { watch, counts } = useMemo(() => summarizeCalving(herd), [herd]);

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
            <Baby size={24} strokeWidth={2} color="var(--sage-deep)" /> Partos
          </h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {counts.imminent + counts.overdue} requieren atención · {counts.dueSoon} en 3 semanas · {counts.pregnant} preñadas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Atrasada" n={counts.overdue} color="var(--critical)" />
        <Stat label="Inminente (≤3 d)" n={counts.imminent} color="var(--brown)" />
        <Stat label="Próxima (≤3 sem)" n={counts.dueSoon} color="var(--watch)" />
        <Stat label="Gestando" n={counts.carrying} color="var(--healthy)" />
        <Stat label="Preñadas" n={counts.pregnant} color="var(--sage-deep)" />
      </div>

      <h3 className="font-sora text-[17px] font-semibold flex items-center gap-2.5 mb-3.5">
        Vigilancia de partos
        <span className="text-[13px] font-normal" style={{ color: "var(--muted)" }}>próximas 3 semanas</span>
      </h3>

      {watch.length === 0 ? (
        <div className="bg-white border rounded-xl2 text-center text-sm py-10" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Ninguna vaca tiene parto previsto en las próximas tres semanas.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {watch.map((it) => (
            <CalvingRow key={it.a.id} item={it} onOpen={() => selectAnimal(it.a.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function CalvingRow({ item, onOpen }: { item: CalvingItem; onOpen: () => void }) {
  const { a, c } = item;
  const color = BUCKET_COLOR[c.bucket];
  const pct = Math.round((c.gestationDay / c.gestation) * 100);
  return (
    <div
      onClick={onOpen}
      className="bg-white border rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderColor: c.bucket === "overdue" || c.bucket === "imminent" ? color : "var(--border)" }}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
      <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[21px] shrink-0" style={{ background: "var(--card-soft)" }}>
        {SPECIES_EMOJI[a.species]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[15px]">{a.name}</span>
          <span className="text-xs" style={{ color: "var(--faint)" }}>{a.tag_id} · {SPECIES_LABEL[a.species]}</span>
          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-[2px] rounded-[20px] text-white" style={{ background: color }}>
            {BUCKET_LABEL[c.bucket]}
          </span>
        </div>
        <div className="flex items-center gap-2.5 mt-2">
          <div className="flex-1 max-w-[260px] h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className="text-[12px] tabular-nums" style={{ color: "var(--muted)" }}>día {c.gestationDay}/{c.gestation}</span>
        </div>
      </div>
      </div>

      <div className="shrink-0 text-left sm:text-right pl-[56px] sm:pl-0">
        <div className="font-sora text-[14px] font-semibold" style={{ color }}>{calvingLabel(c.daysToCalving)}</div>
        <div className="inline-flex items-center gap-1 text-[12px] mt-0.5" style={{ color: "var(--faint)" }}>
          <CalendarDays size={12} strokeWidth={2.2} /> ≈ {fmtDate(c.daysToCalving)}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div className="bg-white border rounded-[14px] p-3.5" style={{ borderColor: "var(--border)" }}>
      <div className="font-sora text-[24px] font-semibold" style={{ color }}>{n}</div>
      <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
