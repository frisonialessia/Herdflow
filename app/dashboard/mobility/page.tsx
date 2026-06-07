"use client";

// Mobility & welfare board — the lameness worklist. The herd mobility index, the
// distribution of locomotion scores, and the list of lame animals (score 2–3)
// that need a hoof check, worst first.

import { useMemo } from "react";
import { useHerd } from "@/components/HerdProvider";
import { MobilityScale } from "@/components/MobilityCard";
import { SPECIES_EMOJI, SPECIES_LABEL } from "@/lib/types";
import { summarizeMobility, MOB_META, MobScore, MobilityItem } from "@/lib/mobility";
import { Footprints, Activity } from "lucide-react";

export default function MobilityPage() {
  const { herd, selectAnimal } = useHerd();
  const { lame, dist, index, total } = useMemo(() => summarizeMobility(herd), [herd]);

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
            <Footprints size={24} strokeWidth={2} color="var(--sage-deep)" /> Mobility & welfare
          </h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {lame.length} lame (score 2–3) · {total} hooved animals scored
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[18px] mb-6">
        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Herd Mobility Index</div>
          <div className="font-sora text-[40px] font-semibold mt-1" style={{ color: index >= 85 ? "var(--healthy)" : index >= 70 ? "var(--watch)" : "var(--critical)" }}>
            {index}%
          </div>
          <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>scoring 0–1 (sound)</div>
        </div>

        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Locomotion score distribution</div>
          <div className="flex h-3 rounded-full overflow-hidden mb-4" style={{ background: "var(--card-soft)" }}>
            {([0, 1, 2, 3] as MobScore[]).map((s) =>
              dist[s] > 0 ? <div key={s} style={{ width: `${(dist[s] / total) * 100}%`, background: MOB_META[s].color }} title={`${MOB_META[s].label}: ${dist[s]}`} /> : null
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([0, 1, 2, 3] as MobScore[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: MOB_META[s].color }} />
                <div>
                  <div className="font-sora text-[16px] font-semibold leading-none">{dist[s]}</div>
                  <div className="text-[11px]" style={{ color: "var(--muted)" }}>{s} · {MOB_META[s].short}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className="font-sora text-[17px] font-semibold flex items-center gap-2.5 mb-3.5">
        Needs a hoof check
        <span className="text-white rounded-[20px] px-2.5 text-[13px] font-semibold" style={{ background: "var(--brown)" }}>{lame.length}</span>
      </h3>

      {lame.length === 0 ? (
        <div className="bg-white border rounded-xl2 text-center text-sm py-10" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          No lame animals — the whole herd is scoring 0–1.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lame.map((it) => (
            <LameRow key={it.a.id} item={it} onOpen={() => selectAnimal(it.a.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function LameRow({ item, onOpen }: { item: MobilityItem; onOpen: () => void }) {
  const { a, m } = item;
  const meta = MOB_META[m.score];
  return (
    <div
      onClick={onOpen}
      className="bg-white border rounded-[16px] p-4 flex items-center gap-3.5 cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderColor: m.score === 3 ? meta.color : "var(--border)" }}
    >
      <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[21px] shrink-0" style={{ background: "var(--card-soft)" }}>
        {SPECIES_EMOJI[a.species]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[15px]">{a.name}</span>
          <span className="text-xs" style={{ color: "var(--faint)" }}>{a.tag_id} · {SPECIES_LABEL[a.species]}</span>
          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-[2px] rounded-[20px] text-white" style={{ background: meta.color }}>
            {meta.short}
          </span>
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>{meta.note}</div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <MobilityScale score={m.score} />
        {m.drop >= 0.05 && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: meta.color }}>
            <Activity size={12} strokeWidth={2.2} /> −{Math.round(m.drop * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
