"use client";

// Slide-in detail panel for a single animal. Opens whenever an animal is
// selected anywhere (table row, alert card, map pin, live feed) and shows its
// current vitals vs baseline, the trend of its most-deviated metric (with the
// ±2σ band + z-score readout from TrendChart) and a short reading history.

import { useEffect, useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { TrendChart } from "@/components/TrendChart";
import { PredictivePanel } from "@/components/PredictivePanel";
import { CasePanel } from "@/components/CasePanel";
import { ReproCard } from "@/components/ReproCard";
import { MobilityCard } from "@/components/MobilityCard";
import { NutritionCard } from "@/components/NutritionCard";
import { ProfileCard } from "@/components/ProfileCard";
import { AnimalMedia } from "@/components/AnimalMedia";
import { HistoryTimeline } from "@/components/HistoryTimeline";
import { EditAnimalModal } from "@/components/EditAnimalModal";
import { MetricKey, SPECIES_EMOJI, SPECIES_LABEL } from "@/lib/types";
import { STATUS_LABEL, METRIC_LABEL, fmtMetric, timeAgo } from "@/lib/format";
import { inferCondition } from "@/lib/conditions";
import { analyzeForecast } from "@/lib/forecast";
import { X, Stethoscope, Pencil } from "lucide-react";

const METRIC_ORDER: MetricKey[] = ["temperature_c", "heart_rate", "respiration_rate", "activity_index", "rumination_min", "intake_kg"];

export function AnimalDrawer() {
  const { selected, selectAnimal } = useHerd();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editing) selectAnimal(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, selectAnimal, editing]);

  if (!selected) return null;

  const a = selected;
  const statusColor =
    a.status === "critical" ? "var(--critical)" : a.status === "watch" ? "var(--watch)" : "var(--healthy)";
  const metrics = METRIC_ORDER.filter((m) => m !== "rumination_min" || a.baseline.rumination_min > 0);
  const dev = a.deviation;
  const cond = inferCondition(a);
  const forecast = a.status !== "healthy" ? analyzeForecast(a) : null;
  const history = a.series.slice(-7).reverse(); // most recent first

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(35,44,34,0.45)" }} onClick={() => selectAnimal(null)} />

      <div
        className="relative h-full w-full max-w-[480px] overflow-y-auto animate-slide"
        style={{ background: "var(--bg)", boxShadow: "-20px 0 50px -20px rgba(58,90,64,0.45)" }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[26px]" style={{ background: "var(--card-soft)" }}>
                {SPECIES_EMOJI[a.species]}
              </div>
              <div>
                <div className="font-sora text-[20px] font-semibold leading-tight">{a.name}</div>
                <div className="text-[13px]" style={{ color: "var(--muted)" }}>
                  {a.tag_id} · {SPECIES_LABEL[a.species]} · {a.paddock}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditing(true)}
                title="Editar ficha"
                className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                <Pencil size={16} strokeWidth={2} color="var(--sage-deep)" />
              </button>
              <button
                onClick={() => selectAnimal(null)}
                title="Cerrar"
                className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                <X size={18} strokeWidth={2} color="var(--sage-deep)" />
              </button>
            </div>
          </div>

          <span
            className="text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px] uppercase tracking-wide text-white inline-block mb-5"
            style={{ background: statusColor }}
          >
            {STATUS_LABEL[a.status]}
          </span>

          <ProfileCard animal={a} />

          <AnimalMedia animal={a} />

          <HistoryTimeline animal={a} />

          {a.status !== "healthy" && (
            <div className="rounded-[14px] p-3.5 mb-5 flex gap-3" style={{ background: "#f3ece3", border: "1px solid var(--brown-soft)" }}>
              <Stethoscope size={18} strokeWidth={2} color="var(--brown)" className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--brown)" }}>Sospecha</div>
                <div className="text-[14px] font-semibold mt-0.5">{cond.label}</div>
                <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{cond.note}</div>
              </div>
            </div>
          )}

          <PredictivePanel forecast={forecast} />

          <ReproCard animal={a} />

          <MobilityCard animal={a} />

          <NutritionCard animal={a} />

          {a.status !== "healthy" && <CasePanel animalId={a.id} />}

          <div className="grid grid-cols-2 gap-3 mb-5">
            {metrics.map((m) => {
              const isDev = m === dev.metric && a.status !== "healthy";
              return (
                <div key={m} className="bg-white border rounded-[14px] p-3.5" style={{ borderColor: isDev ? statusColor : "var(--border)" }}>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--faint)" }}>{METRIC_LABEL[m]}</div>
                  <div className="font-sora text-[19px] font-semibold mt-0.5" style={{ color: isDev ? statusColor : "var(--ink)" }}>
                    {fmtMetric(m, a.latest[m])}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>línea base {fmtMetric(m, a.baseline[m])}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border rounded-xl2 p-[18px] mb-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-sora text-[15px] font-semibold">Tendencia de {METRIC_LABEL[dev.metric]}</h3>
              <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px] uppercase tracking-wide"
                    style={{ background: "var(--brown-soft)", color: "var(--brown)" }}>línea base 14 días</span>
            </div>
            <TrendChart animal={a} metric={dev.metric} forecast={forecast?.projectionValues} />
          </div>

          <div className="bg-white border rounded-xl2 p-[18px]" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-sora text-[15px] font-semibold mb-3">Lecturas recientes de {METRIC_LABEL[dev.metric].toLowerCase()}</h3>
            <div className="flex flex-col gap-2">
              {history.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <span style={{ color: "var(--muted)" }}>{timeAgo(p.recorded_at)}</span>
                  <span className="font-sora font-semibold">{fmtMetric(dev.metric, p[dev.metric])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editing && <EditAnimalModal animal={a} onClose={() => setEditing(false)} />}
    </div>
  );
}
