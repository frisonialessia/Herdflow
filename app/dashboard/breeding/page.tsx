"use client";

// Reproduction board — the breeding worklist. Cows in standing heat right now
// (with the insemination-window countdown and a one-tap "Mark bred"), cows
// approaching heat in the next 48 h, and the herd's reproductive status mix.

import { useMemo } from "react";
import { useHerd } from "@/components/HerdProvider";
import { SPECIES_EMOJI, SPECIES_LABEL } from "@/lib/types";
import { summarizeRepro, aiWindow, ReproItem } from "@/lib/repro";
import { HeartPulse, Activity, CalendarDays, Syringe } from "lucide-react";

export default function BreedingPage() {
  const { herd, bred, markBred, selectAnimal } = useHerd();
  const summary = useMemo(() => summarizeRepro(herd, bred), [herd, bred]);
  const { inHeat, approaching, counts } = summary;

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
            <HeartPulse size={24} strokeWidth={2} color="var(--sage-deep)" /> Reproduction
          </h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {counts.inHeat} in heat now · {counts.approaching} approaching · {counts.breedable} breedable females
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="In heat now" n={counts.inHeat} color="var(--sage-deep)" />
        <Stat label="Approaching 48 h" n={counts.approaching} color="var(--watch)" />
        <Stat label="Open" n={counts.open} color="var(--faint)" />
        <Stat label="Bred" n={counts.bred} color="var(--brown)" />
        <Stat label="Pregnant" n={counts.pregnant} color="var(--healthy)" />
      </div>

      <h3 className="font-sora text-[17px] font-semibold flex items-center gap-2.5 mb-3.5">
        In heat — breed now
        <span className="text-white rounded-[20px] px-2.5 text-[13px] font-semibold" style={{ background: "var(--sage-deep)" }}>{counts.inHeat}</span>
      </h3>
      {inHeat.length === 0 ? (
        <Empty text="No cows in standing heat right now. Approaching cows are listed below." />
      ) : (
        <div className="flex flex-col gap-2.5 mb-7">
          {inHeat.map((it) => (
            <HeatCard key={it.a.id} item={it} onOpen={() => selectAnimal(it.a.id)} onBreed={() => markBred(it.a.id)} />
          ))}
        </div>
      )}

      <h3 className="font-sora text-[17px] font-semibold flex items-center gap-2.5 mb-3.5 mt-1">
        Approaching heat
        <span className="text-[13px] font-normal" style={{ color: "var(--muted)" }}>next 48 h</span>
      </h3>
      {approaching.length === 0 ? (
        <Empty text="No cows are due to come into heat in the next 48 hours." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {approaching.map((it) => (
            <div
              key={it.a.id}
              onClick={() => selectAnimal(it.a.id)}
              className="bg-white border rounded-[14px] p-3.5 flex items-center gap-3 cursor-pointer transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[19px] shrink-0" style={{ background: "var(--card-soft)" }}>
                {SPECIES_EMOJI[it.a.species]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px]">{it.a.name} <span className="text-xs font-normal" style={{ color: "var(--faint)" }}>{it.a.tag_id}</span></div>
                <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{SPECIES_LABEL[it.a.species]} · {it.r.dim} DIM</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-[20px] shrink-0" style={{ background: "var(--brown-soft)", color: "var(--brown)" }}>
                <CalendarDays size={13} strokeWidth={2.2} /> ~{it.r.daysToHeat} d
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function HeatCard({ item, onOpen, onBreed }: { item: ReproItem; onOpen: () => void; onBreed: () => void }) {
  const { a, r } = item;
  const win = aiWindow(r.onsetHoursAgo ?? 6);
  return (
    <div
      onClick={onOpen}
      className="bg-white border rounded-[16px] p-4 cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderColor: win.state === "open" ? "var(--sage)" : "var(--border)" }}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[21px] shrink-0" style={{ background: "var(--card-soft)" }}>
          {SPECIES_EMOJI[a.species]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[15px]">{a.name}</span>
            <span className="text-xs" style={{ color: "var(--faint)" }}>{a.tag_id} · {SPECIES_LABEL[a.species]} · {r.dim} DIM</span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2 py-[2px] rounded-[20px] text-white" style={{ background: "var(--sage-deep)" }}>
              <HeartPulse size={11} strokeWidth={2.4} color="#fff" /> In heat
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-[2px] rounded-[20px]" style={{ background: "var(--card-soft)", color: "var(--muted)" }}>
              <Activity size={11} strokeWidth={2.4} /> {r.confidence} · {r.detectedBy === "activity" ? "activity spike" : "cycle"}
            </span>
          </div>
          <div className="text-[12.5px] mt-1.5" style={{ color: "var(--muted)" }}>
            Onset ~{r.onsetHoursAgo} h ago · <span style={{ color: win.color, fontWeight: 600 }}>{win.label}</span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <Intensity v={r.intensity ?? 0} />
          <button
            onClick={(e) => { e.stopPropagation(); onBreed(); }}
            className="flex items-center gap-1.5 text-white border-0 rounded-[20px] px-3.5 py-2 text-[12.5px] font-medium cursor-pointer"
            style={{ background: "var(--sage-deep)" }}
          >
            <Syringe size={14} strokeWidth={2.2} color="#fff" /> Mark bred
          </button>
        </div>
      </div>
    </div>
  );
}

function Intensity({ v }: { v: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--faint)" }}>Heat</span>
      <div className="w-[64px] h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: "var(--sage-deep)" }} />
      </div>
      <span className="font-sora text-[12px] font-semibold tabular-nums" style={{ width: 22 }}>{v}</span>
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

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-white border rounded-xl2 text-center text-sm py-9 mb-7" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
      {text}
    </div>
  );
}
