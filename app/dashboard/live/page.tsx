"use client";

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { MetricKey, SPECIES_EMOJI, SPECIES_LABEL } from "@/lib/types";
import { TrendChart } from "@/components/TrendChart";
import { fmtMetric, fmtZ, METRIC_LABEL } from "@/lib/format";
import { BarChart3, BatteryMedium, Activity, CheckCircle2 } from "lucide-react";

const METRICS: MetricKey[] = ["temperature_c", "activity_index", "rumination_min"];

export default function LivePage() {
  const { herd, selectAnimal } = useHerd();
  const flagged = herd.filter((a) => a.status !== "healthy");
  const [animalId, setAnimalId] = useState(flagged[0]?.id ?? herd[0].id);
  const [metric, setMetric] = useState<MetricKey>("temperature_c");

  const animal = herd.find((a) => a.id === animalId)!;
  // metrics this species actually has
  const available = METRICS.filter((m) => m !== "rumination_min" || animal.baseline.rumination_min > 0);

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight">Live Monitoring</h2>
          <div className="text-[13px] mt-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse-dot" style={{ background: "var(--healthy)" }} />
            Streaming · {herd.length} sensors online
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl2 p-6" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between mb-1.5 flex-wrap gap-3">
          <div>
            <h3 className="font-sora text-[17px] font-semibold flex items-center gap-2.5">
              Predictive Trend
              <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px] uppercase tracking-wide"
                    style={{ background: "var(--brown-soft)", color: "var(--brown)" }}>AI baseline</span>
            </h3>
            <p className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
              {METRIC_LABEL[metric]} vs. this animal's 14-day baseline · deviation band ±2σ
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={animalId} onChange={(e) => setAnimalId(e.target.value)}
                    className="rounded-[10px] px-3 py-[7px] text-[12.5px] cursor-pointer border"
                    style={{ background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}>
              {herd.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {a.tag_id}</option>
              ))}
            </select>
            <div className="flex rounded-[10px] overflow-hidden border" style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}>
              {available.map((m) => (
                <button key={m} onClick={() => setMetric(m)}
                        className="px-3 py-[7px] text-[12.5px] cursor-pointer border-0"
                        style={metric === m
                          ? { background: "var(--sage-deep)", color: "#fff" }
                          : { background: "transparent", color: "var(--muted)" }}>
                  {METRIC_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <TrendChart animal={animal} metric={available.includes(metric) ? metric : available[0]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[18px] mt-[18px]">
        <div className="flex flex-col gap-3">
          {herd.slice(0, 6).map((a) => {
            const alarm = a.status !== "healthy";
            const color = a.status === "critical" ? "var(--critical)" : a.status === "watch" ? "var(--watch)" : "var(--healthy)";
            return (
              <div key={a.id} onClick={() => selectAnimal(a.id)} className="flex items-center gap-3.5 px-4 py-3.5 bg-white border rounded-[16px] cursor-pointer hover:bg-[var(--card-soft)] transition-colors" style={{ borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-[20px] shrink-0" style={{ background: "var(--card-soft)" }}>
                  {SPECIES_EMOJI[a.species]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[14.5px]">{a.name} · {a.tag_id}</div>
                  <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{SPECIES_LABEL[a.species]} · {a.paddock}</div>
                </div>
                <div className="text-right">
                  <div className="font-sora text-[17px] font-semibold" style={{ color: alarm ? color : "var(--ink)" }}>
                    {fmtMetric(a.deviation.metric, a.deviation.observed)}
                  </div>
                  <div className="text-[12.5px]" style={{ color }}>{alarm ? fmtZ(a.deviation.z_score) : "normal"}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-[18px]">
            <h3 className="font-sora text-base font-semibold">Sensor Health</h3>
            <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center" style={{ background: "var(--card-soft)" }}>
              <CheckCircle2 size={18} strokeWidth={2} color="var(--sage-deep)" />
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <SensorRow icon={<BarChart3 size={18} strokeWidth={2} color="var(--brown)" />} t="Online" v={`${herd.length} / ${herd.length}`} />
            <SensorRow icon={<BatteryMedium size={18} strokeWidth={2} color="var(--brown)" />} t="Avg Battery" v="86%" />
            <SensorRow icon={<Activity size={18} strokeWidth={2} color="var(--brown)" />} t="Data Quality" v="Good" />
          </div>
          <div className="border-t mt-[18px] pt-4" style={{ borderColor: "var(--border)" }}>
            <div className="text-xs uppercase tracking-wide mb-2.5" style={{ color: "var(--faint)" }}>Needs attention</div>
            <NeedsRow t={`Tag ${herd[1].tag_id} · low battery`} v="14%" vColor="var(--watch)" />
            <NeedsRow t={`Tag ${herd[2].tag_id} · weak signal`} v="2 bars" vColor="var(--muted)" />
          </div>
          <div className="border-t mt-4 pt-3.5 flex justify-between items-center text-[13px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            <span>Next calibration</span><span className="font-semibold" style={{ color: "var(--ink)" }}>in 6 days</span>
          </div>
          <div className="text-[11px] mt-3" style={{ color: "var(--faint)" }}>Sensor metrics are illustrative.</div>
        </div>
      </div>
    </section>
  );
}

function SensorRow({ icon, t, v }: { icon: React.ReactNode; t: string; v: string }) {
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

function NeedsRow({ t, v, vColor }: { t: string; v: string; vColor: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] mb-2.5 last:mb-0">
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--watch)" }} />
      <span className="flex-1">{t}</span>
      <span className="font-semibold" style={{ color: vColor }}>{v}</span>
    </div>
  );
}
