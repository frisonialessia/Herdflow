"use client";

// Today — the action center. Every pillar's worklist, fused into one
// priority-ranked list of what needs doing, grouped Urgent / Today / Upcoming.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useHerd } from "@/components/HerdProvider";
import { buildToday, Domain, Tier, ActionItem } from "@/lib/today";
import { Stethoscope, ShieldAlert, ThermometerSun, HeartPulse, Baby, Footprints, Wheat, ChevronRight, Sun, CheckCircle2, LucideIcon } from "lucide-react";

const DOMAIN: Record<Domain, { label: string; icon: LucideIcon; color: string }> = {
  health: { label: "Health", icon: Stethoscope, color: "var(--critical)" },
  biosecurity: { label: "Biosecurity", icon: ShieldAlert, color: "var(--brown)" },
  heat: { label: "Heat", icon: ThermometerSun, color: "var(--brown)" },
  breeding: { label: "Breeding", icon: HeartPulse, color: "var(--sage-deep)" },
  calving: { label: "Calving", icon: Baby, color: "var(--sage-deep)" },
  welfare: { label: "Welfare", icon: Footprints, color: "var(--brown)" },
  nutrition: { label: "Nutrition", icon: Wheat, color: "var(--brown)" },
};

const TIERS: { key: Tier; label: string; color: string; note: string }[] = [
  { key: "urgent", label: "Urgent now", color: "var(--critical)", note: "act immediately" },
  { key: "today", label: "Today", color: "var(--watch)", note: "before end of day" },
  { key: "upcoming", label: "Upcoming", color: "var(--sage)", note: "next few days" },
];

export default function TodayPage() {
  const { herd, caseFor, cases, bred, selectAnimal } = useHerd();
  const board = useMemo(() => buildToday({ herd, caseFor, bred, now: new Date() }), [herd, cases, bred]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filter, setFilter] = useState<Domain | "all">("all");

  const domains = (Object.keys(DOMAIN) as Domain[]).filter((d) => board.byDomain[d] > 0);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const match = (it: ActionItem) => filter === "all" || it.domain === filter;

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[18px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
            <Sun size={24} strokeWidth={2} color="var(--sage-deep)" /> Today
          </h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {today} · <b style={{ color: "var(--critical)" }}>{board.counts.urgent} urgent</b> · {board.counts.today} today · {board.counts.upcoming} upcoming
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        <Chip label="All" n={board.counts.total} active={filter === "all"} onClick={() => setFilter("all")} />
        {domains.map((d) => (
          <Chip key={d} label={DOMAIN[d].label} n={board.byDomain[d]} active={filter === d} onClick={() => setFilter(d)} />
        ))}
      </div>

      {board.counts.total === 0 ? (
        <AllClear />
      ) : (
        TIERS.map(({ key, label, color, note }) => {
          const items = board.byTier[key].filter(match);
          if (items.length === 0) return null;
          return (
            <div key={key} className="mb-6">
              <h3 className="font-sora text-[15px] font-semibold flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {label}
                <span className="text-white rounded-[20px] px-2 text-[12px] font-semibold" style={{ background: color }}>{items.length}</span>
                <span className="text-[12px] font-normal" style={{ color: "var(--faint)" }}>· {note}</span>
              </h3>
              <div className="flex flex-col gap-2.5">
                {items.map((it) => (
                  <ActionRow key={it.id} item={it} tierColor={color} onOpen={() => it.animalId && selectAnimal(it.animalId)} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

function ActionRow({ item, tierColor, onOpen }: { item: ActionItem; tierColor: string; onOpen: () => void }) {
  const d = DOMAIN[item.domain];
  const Icon = d.icon;

  const inner = (
    <>
      <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: tierColor }} />
      <div className="w-[40px] h-[40px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "var(--card-soft)" }}>
        <Icon size={19} strokeWidth={2} color={d.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[14.5px]">{item.title}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-[20px]" style={{ background: "var(--card-soft)", color: d.color }}>{d.label}</span>
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: "var(--muted)" }}>{item.detail}</div>
      </div>
      <span className="flex items-center gap-1 text-[12.5px] font-medium shrink-0 self-center" style={{ color: "var(--sage-deep)" }}>
        {item.cta} <ChevronRight size={15} strokeWidth={2.2} />
      </span>
    </>
  );

  const cls = "group bg-white border rounded-[14px] p-3.5 flex items-center gap-3 cursor-pointer transition-shadow hover:shadow-md text-left w-full";
  return item.href ? (
    <Link href={item.href} className={cls} style={{ borderColor: "var(--border)" }}>{inner}</Link>
  ) : (
    <button onClick={onOpen} className={cls} style={{ borderColor: "var(--border)" }}>{inner}</button>
  );
}

function Chip({ label, n, active, onClick }: { label: string; n: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl px-3.5 py-2 text-[13px] cursor-pointer border flex items-center gap-2"
      style={active ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" } : { background: "var(--card-soft)", borderColor: "var(--border)" }}
    >
      {label}
      <span className="rounded-[20px] px-1.5 text-[11px] font-semibold" style={active ? { background: "rgba(255,255,255,0.22)" } : { background: "var(--border)", color: "var(--muted)" }}>{n}</span>
    </button>
  );
}

function AllClear() {
  return (
    <div className="bg-white border rounded-xl2 text-center py-14" style={{ borderColor: "var(--border)" }}>
      <CheckCircle2 size={40} strokeWidth={1.8} color="var(--healthy)" className="mx-auto mb-3" />
      <div className="font-sora text-[17px] font-semibold">All clear</div>
      <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>Nothing needs your attention right now.</div>
    </div>
  );
}
