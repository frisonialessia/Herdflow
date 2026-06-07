"use client";

import { Animal, MetricKey } from "@/lib/types";
import { normalBand } from "@/lib/anomaly";
import { fmtMetric, fmtZ, METRIC_LABEL } from "@/lib/format";

const W = 720;
const H = 240;

export function TrendChart({
  animal,
  metric,
  forecast = [],
}: {
  animal: Animal;
  metric: MetricKey;
  forecast?: number[];
}) {
  const vals = animal.series.map((p) => p[metric]);
  const window = vals.slice(0, -1);
  const { mean, lower, upper } = normalBand(window);

  // y-domain with padding so the band + curve fit comfortably (from history +
  // band only — the forecast is clamped into view so a steep slope can't blow
  // up the scale).
  const lo = Math.min(lower, ...vals);
  const hi = Math.max(upper, ...vals);
  const pad = (hi - lo) * 0.15 || 1;
  const yMin = lo - pad;
  const yMax = hi + pad;
  const y = (v: number) => H - ((v - yMin) / (yMax - yMin)) * H;
  const yC = (v: number) => Math.max(2, Math.min(H - 2, y(v)));
  const total = vals.length + forecast.length;
  const x = (i: number) => (i / (total - 1)) * W;

  const line = vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const nowX = x(vals.length - 1);
  const projPath = forecast.length
    ? `M${nowX.toFixed(1)},${yC(vals[vals.length - 1]).toFixed(1)} ` +
      forecast.map((v, j) => `L${x(vals.length + j).toFixed(1)},${yC(v).toFixed(1)}`).join(" ")
    : "";

  // first index where the reading breaks the band (the "breach")
  const breachIdx = vals.findIndex((v, i) => i > window.length * 0.5 && (v > upper || v < lower));

  const baseline = animal.deviation.baseline;
  const observed = animal.deviation.observed;
  const z = animal.deviation.z_score;
  const alarm = animal.deviation.severity !== "healthy";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6 mt-[18px] items-center">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[240px] block">
          {/* gridlines */}
          {[40, 100, 160, 220].map((gy) => (
            <line key={gy} x1="0" y1={gy} x2={W} y2={gy} stroke="#eceee3" strokeWidth="1" />
          ))}
          {/* normal band ±2σ (flat fill, no gradient) */}
          <rect x="0" y={y(upper)} width={W} height={Math.max(0, y(lower) - y(upper))}
                fill="#588157" fillOpacity="0.14" />
          {/* baseline (dashed) */}
          <line x1="0" y1={y(mean)} x2={W} y2={y(mean)} stroke="#588157" strokeWidth="2" strokeDasharray="6 6" />
          {/* actual reading */}
          <path d={line} fill="none" stroke="#8a4f32" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* projection: where the trend is heading */}
          {forecast.length > 0 && (
            <>
              <line x1={nowX} y1="0" x2={nowX} y2={H} stroke="#9aa091" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
              <path d={projPath} fill="none" stroke="#8a4f32" strokeWidth="2.4" strokeDasharray="2 6" strokeLinecap="round" opacity="0.85" />
              <text x={Math.min(W - 60, nowX + 6)} y="15" fontFamily="Outfit" fontSize="11" fill="#8a4f32">proyección</text>
            </>
          )}
          {/* breach marker */}
          {breachIdx > -1 && (
            <>
              <circle cx={x(breachIdx)} cy={y(vals[breachIdx])} r="4" fill="#8a4f32" />
              <line x1={x(breachIdx)} y1={y(vals[breachIdx])} x2={x(breachIdx)} y2={y(lower)}
                    stroke="#8a4f32" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <text x={x(breachIdx) + 6} y={y(vals[breachIdx]) - 4} fontFamily="Outfit" fontSize="11" fill="#8a4f32">
                ruptura
              </text>
            </>
          )}
          {/* current point */}
          <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r="5"
                  fill="#8a4f32" stroke="#fff" strokeWidth="2" />
        </svg>
        <div className="flex gap-[18px] mt-2.5 text-[12.5px] flex-wrap" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-[7px]">
            <span className="w-[18px]" style={{ borderTop: "2.5px solid var(--critical)" }} /> Lectura actual
          </span>
          <span className="flex items-center gap-[7px]">
            <span className="w-[18px]" style={{ borderTop: "2px dashed var(--sage)" }} /> Línea base (prom. 14 días)
          </span>
          <span className="flex items-center gap-[7px]">
            <span className="w-[14px] h-[11px] rounded-[3px]" style={{ background: "rgba(88,129,87,0.16)" }} /> Rango normal ±2σ
          </span>
          {forecast.length > 0 && (
            <span className="flex items-center gap-[7px]">
              <span className="w-[18px]" style={{ borderTop: "2.4px dotted var(--critical)" }} /> Tendencia proyectada
            </span>
          )}
        </div>
      </div>

      <div className="lg:border-l lg:pl-[22px] border-t lg:border-t-0 pt-[18px] lg:pt-0" style={{ borderColor: "var(--border)" }}>
        <Readout k="Actual" v={fmtMetric(metric, observed)} alarm={alarm} />
        <Readout k="Línea base" v={fmtMetric(metric, baseline)} />
        <Readout k="Z-score" v={fmtZ(z)} alarm={alarm} />
        {alarm && (
          <div className="rounded-xl p-3 text-[12.5px] leading-relaxed"
               style={{ background: "#f3ece3", border: "1px solid var(--brown-soft)", color: "var(--brown)" }}>
            {METRIC_LABEL[metric]} rompió el rango normal y va {z > 0 ? "en aumento" : "en descenso"}. Se recomienda revisión veterinaria.
          </div>
        )}
      </div>
    </div>
  );
}

function Readout({ k, v, alarm }: { k: string; v: string; alarm?: boolean }) {
  return (
    <div className="mb-4">
      <div className="text-[11.5px] uppercase tracking-wide" style={{ color: "var(--faint)" }}>{k}</div>
      <div className="font-sora text-[22px] font-semibold mt-0.5" style={{ color: alarm ? "var(--critical)" : "var(--ink)" }}>
        {v}
      </div>
    </div>
  );
}
