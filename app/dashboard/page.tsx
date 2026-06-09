"use client";

import { useMemo, useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { herdSummary } from "@/lib/mock_data_generator";
import { SPECIES_EMOJI, SPECIES_LABEL, Species, Animal } from "@/lib/types";
import { STATUS_LABEL, fmtZ, timeAgo } from "@/lib/format";
import { inferCondition } from "@/lib/conditions";
import { detectOutbreaks } from "@/lib/outbreak";
import { analyzeForecast } from "@/lib/forecast";
import { PastureMap } from "@/components/PastureMap";
import { OutbreakBanner } from "@/components/OutbreakBanner";
import { HeatBanner } from "@/components/HeatBanner";
import { TodayBar } from "@/components/TodayBar";
import { AddAnimalButton } from "@/components/AddAnimalButton";
import { EmptyHerd } from "@/components/EmptyHerd";
import { RoleHome } from "@/components/RoleHome";
import { Thermometer, Activity, Wheat, Beef, Layers, Heart, Wind, Zap } from "lucide-react";

const fmtH = (h: number) => (h >= 48 ? `${Math.round(h / 24)}d` : `${h}h`);

export default function OverviewPage() {
  const { herd, selectAnimal, persisted } = useHerd();
  const [group, setGroup] = useState<Species | "all">("all");
  const shown = group === "all" ? herd : herd.filter((a) => a.species === group);

  const s = herdSummary(shown);
  const alerts = shown.filter((a) => a.status !== "healthy").slice(0, 3);
  const outbreaks = useMemo(() => detectOutbreaks(shown), [shown]);

  // per-group counts (from the full herd, so the selector shows real totals)
  const countFor = (sp: Species | "all") =>
    sp === "all" ? herd.length : herd.filter((a) => a.species === sp).length;

  const groups: { label: string; sp: Species | "all" }[] = [
    { label: "Todos", sp: "all" },
    { label: "Vacas lecheras", sp: "dairy" },
    { label: "Carne", sp: "beef" },
    { label: "Ovejas", sp: "sheep" },
    { label: "Caballos", sp: "horse" },
    { label: "Aves", sp: "poultry" },
  ];

  // herd-average vitals (animals that have each metric) within the shown group
  const avg = (key: "temperature_c" | "activity_index" | "rumination_min" | "intake_kg" | "heart_rate" | "respiration_rate", f = 1) => {
    const xs = shown.map((a) => a.latest[key]).filter((v) => v > 0);
    return xs.length ? xs.reduce((p, c) => p + c, 0) / xs.length / f : 0;
  };

  // Fresh tenant (real mode) with no animals yet → onboarding screen.
  if (persisted && herd.length === 0) return <EmptyHerd />;

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[32px] font-semibold tracking-tight">Tu hato</h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>Potrero A · sincronizado ahora</div>
        </div>
        <div className="flex gap-2.5 items-center">
          <Chip label="Sano" n={s.healthy} color="var(--healthy)" />
          <Chip label="En vigilancia" n={s.watch} color="var(--watch)" />
          <AddAnimalButton />
        </div>
      </div>

      <RoleHome />

      <TodayBar />
      <OutbreakBanner outbreaks={outbreaks} onSelect={selectAnimal} />
      <HeatBanner herd={shown} onSelect={selectAnimal} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-[18px] items-stretch">
        <div className="relative h-full">
          <PastureMap herd={shown} onSelect={selectAnimal} outbreaks={outbreaks} />
          <div className="absolute bottom-5 left-5 z-[3] rounded-[18px] px-5 py-4"
               style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Índice de salud del hato</div>
            <div className="font-sora text-[30px] font-semibold mt-1">{s.index}%</div>
            <div className="flex gap-3.5 mt-3 text-[13px]" style={{ color: "var(--muted)" }}>
              <Legend c="var(--healthy)" t={`Sano ${s.healthy}`} />
              <Legend c="var(--watch)" t={`Vigilancia ${s.watch}`} />
              <Legend c="var(--critical)" t={`Crítico ${s.critical}`} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Panel title="Signos vitales del hato" icon={<Activity size={18} strokeWidth={2} color="var(--sage-deep)" />}>
            <div className="grid grid-cols-2 gap-4">
              <Vital icon={<Thermometer size={18} strokeWidth={2} color="var(--brown)" />} t="Temp. prom." v={`${avg("temperature_c").toFixed(1)}°C`} />
              <Vital icon={<Activity size={18} strokeWidth={2} color="var(--brown)" />} t="Índice de actividad" v={`${Math.round(avg("activity_index"))}`} />
              <Vital icon={<Wheat size={18} strokeWidth={2} color="var(--brown)" />} t="Rumia" v={`${Math.round(avg("rumination_min"))} min`} />
              <Vital icon={<Beef size={18} strokeWidth={2} color="var(--brown)" />} t="Consumo prom." v={`${avg("intake_kg").toFixed(1)} kg`} />
              <Vital icon={<Heart size={18} strokeWidth={2} color="var(--brown)" />} t="Frec. cardíaca" v={`${Math.round(avg("heart_rate"))} bpm`} />
              <Vital icon={<Wind size={18} strokeWidth={2} color="var(--brown)" />} t="Respiración" v={`${Math.round(avg("respiration_rate"))}/min`} />
            </div>
          </Panel>

          <Panel title="Grupo / Lote" icon={<Layers size={18} strokeWidth={2} color="var(--sage-deep)" />}>
            <div className="flex gap-2 flex-wrap">
              {groups.map((g) => {
                const active = group === g.sp;
                return (
                  <button key={g.label} onClick={() => setGroup(g.sp)}
                          className="rounded-xl px-3.5 py-2 text-[13px] cursor-pointer border"
                          style={active
                            ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" }
                            : { background: "var(--card-soft)", borderColor: "var(--border)" }}>
                    {g.label} · {countFor(g.sp)}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-[18px]">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-sora text-[17px] font-semibold flex gap-2.5 items-center">
            Alertas críticas
            <span className="text-white rounded-[20px] px-2.5 text-[13px] font-semibold" style={{ background: "var(--critical)" }}>
              {s.watch + s.critical}
            </span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {alerts.length === 0 ? (
            <div className="rounded-[18px] p-[18px] border bg-white text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              Sin alertas en este grupo — cada animal está dentro de su rango normal.
            </div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} onClick={() => selectAnimal(a.id)}
                   className="relative overflow-hidden rounded-[18px] p-[18px] border bg-white cursor-pointer transition-shadow hover:shadow-lg"
                   style={{ borderColor: "var(--border)" }}>
                <span className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ background: a.status === "critical" ? "var(--critical)" : "var(--watch)" }} />
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[19px]"
                         style={{ background: "var(--card-soft)" }}>{SPECIES_EMOJI[a.species]}</div>
                    <div>
                      <div className="font-semibold text-[15px]">{a.name}</div>
                      <div className="text-xs" style={{ color: "var(--faint)" }}>{a.tag_id} · {SPECIES_LABEL[a.species]}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px] uppercase tracking-wide text-white"
                        style={{ background: a.status === "critical" ? "var(--critical)" : "var(--watch)" }}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <div className="text-sm mb-2">{inferCondition(a).label}</div>
                <LeadChip animal={a} />
                <div className="flex justify-between text-[12.5px]" style={{ color: "var(--muted)" }}>
                  <span>z-score <span className="font-semibold" style={{ color: "var(--ink)" }}>{fmtZ(a.deviation.z_score)}</span></span>
                  <span>{timeAgo(a.latest.recorded_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// Small predictive badge on an alert card: how early we flagged it, or — if not
// yet critical — the projected time-to-critical at the current trend.
function LeadChip({ animal }: { animal: Animal }) {
  const f = analyzeForecast(animal);
  if (!f) return null;
  let text: string | null = null;
  if (f.alreadyCritical) {
    const h = f.hoursFlagToCritical && f.hoursFlagToCritical > 0 ? f.hoursFlagToCritical : f.hoursSinceFlag;
    if (h && h > 0) text = `aviso anticipado de ${fmtH(h)}`;
  } else if (f.projectionHours) {
    text = `→ crítico en ~${fmtH(f.projectionHours)}`;
  }
  if (!text) return null;
  return (
    <div className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-[3px] rounded-[20px] mb-2" style={{ background: "var(--sage-deep)", color: "#fff" }}>
      <Zap size={12} strokeWidth={2.4} color="#fff" /> {text}
    </div>
  );
}

function Chip({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div className="bg-white border rounded-[30px] px-4 py-[9px] text-[13px] flex gap-2 items-center"
         style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
      {label} <span className="rounded-[20px] px-2.5 font-semibold text-white" style={{ background: color }}>{n}</span>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return <div className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: c }} /> {t}</div>;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-[18px]">
        <h3 className="font-sora text-base font-semibold">{title}</h3>
        <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center" style={{ background: "var(--card-soft)" }}>{icon}</div>
      </div>
      {children}
    </div>
  );
}

function Vital({ icon, t, v }: { icon: React.ReactNode; t: string; v: string }) {
  return (
    <div className="flex gap-3 items-center">
      <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brown-soft)" }}>{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide" style={{ color: "var(--faint)" }}>{t}</div>
        <div className="font-sora text-[18px] font-semibold">{v}</div>
      </div>
    </div>
  );
}
