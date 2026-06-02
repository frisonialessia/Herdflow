"use client";

// Floating "Demo controls" panel: drive the live telemetry stream and trigger
// anomalies so a visitor can watch the z-score engine catch a fever / activity
// collapse in real time. Sits above the dashboard (z-40), below the drawer.

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { MetricKey } from "@/lib/types";
import { FlaskConical, Play, Pause, RotateCcw, Zap, X } from "lucide-react";

const ANOMALY_TYPES: { label: string; metric: MetricKey }[] = [
  { label: "Fever", metric: "temperature_c" },
  { label: "Activity drop", metric: "activity_index" },
  { label: "Low rumination", metric: "rumination_min" },
];

export function DemoControls() {
  const { herd, live, setLive, simulate, reset, selectAnimal } = useHerd();
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<MetricKey>("temperature_c");
  const [lastName, setLastName] = useState<string | null>(null);

  const flagged = herd.filter((a) => a.status !== "healthy").length;

  function trigger() {
    const pool = herd.filter(
      (a) => a.status === "healthy" && (metric !== "rumination_min" || a.baseline.rumination_min > 0)
    );
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    simulate(pick.id, metric);
    selectAnimal(pick.id); // open the drawer so the breach is visible immediately
    setLastName(pick.name);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {open && (
        <div
          className="mb-3 w-[290px] bg-white border rounded-xl2 p-4"
          style={{ borderColor: "var(--border)", boxShadow: "0 20px 50px -20px rgba(58,90,64,0.45)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-sora text-[15px] font-semibold flex items-center gap-2">
              <FlaskConical size={16} strokeWidth={2} color="var(--sage-deep)" /> Demo controls
            </h3>
            <button onClick={() => setOpen(false)} title="Close" className="cursor-pointer bg-transparent border-0 p-0">
              <X size={16} strokeWidth={2} color="var(--muted)" />
            </button>
          </div>

          <button
            onClick={() => setLive(!live)}
            className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] cursor-pointer border mb-3"
            style={live
              ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" }
              : { background: "var(--card-soft)", borderColor: "var(--border)" }}
          >
            <span className="flex items-center gap-2">
              {live ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
              {live ? "Live telemetry on" : "Start live telemetry"}
            </span>
            {live && <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />}
          </button>

          <div className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: "var(--faint)" }}>
            Trigger anomaly
          </div>
          <div className="flex gap-1.5 mb-2">
            {ANOMALY_TYPES.map((t) => (
              <button
                key={t.metric}
                onClick={() => setMetric(t.metric)}
                className="flex-1 rounded-lg px-2 py-1.5 text-[12px] cursor-pointer border"
                style={metric === t.metric
                  ? { background: "var(--brown-soft)", borderColor: "var(--brown-soft)", color: "var(--brown)" }
                  : { background: "var(--card-soft)", borderColor: "var(--border)" }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={trigger}
            className="w-full flex items-center justify-center gap-2 text-white border-0 rounded-xl px-3.5 py-2.5 text-[13px] font-medium cursor-pointer"
            style={{ background: "var(--critical)" }}
          >
            <Zap size={15} strokeWidth={2} color="#fff" /> Trigger on a healthy animal
          </button>
          {lastName && (
            <div className="text-[12px] mt-2" style={{ color: "var(--muted)" }}>
              Flagged <span className="font-semibold" style={{ color: "var(--ink)" }}>{lastName}</span> — opened in the panel.
            </div>
          )}

          <div className="border-t mt-3 pt-3 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="text-[12px]" style={{ color: "var(--muted)" }}>{flagged} flagged now</span>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-[12px] cursor-pointer bg-transparent border-0 p-0"
              style={{ color: "var(--sage-deep)" }}
            >
              <RotateCcw size={13} strokeWidth={2} /> Reset
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-white border-0 rounded-[30px] px-4 py-2.5 text-[13px] font-medium cursor-pointer"
        style={{ background: "var(--sage-deep)", boxShadow: "0 10px 30px -8px rgba(58,90,64,0.6)" }}
      >
        <FlaskConical size={16} strokeWidth={2} color="#fff" />
        Demo
        {flagged > 0 && (
          <span className="rounded-[20px] px-2 text-[11px] font-semibold" style={{ background: "var(--critical)" }}>
            {flagged}
          </span>
        )}
      </button>
    </div>
  );
}
