"use client";

// Self-contained animated hero visual: a single animal's reading that wiggles
// inside its ±2σ band, then ramps up and breaks it — looping — with a "Critical
// detected" badge. Mirrors TrendChart's visual language (flat band, dashed
// baseline, brown reading line) but is purpose-built for a smooth loop.

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const W = 520;
const H = 220;
const N = 60;
const MEAN = 50;
const SIGMA = 6;
const UPPER = MEAN + 2 * SIGMA; // 62
const LOWER = MEAN - 2 * SIGMA; // 38
const Y_MIN = 30;
const Y_MAX = 82;

// A reading that wiggles within the band, then ramps up and breaks it.
const SERIES = Array.from({ length: N }, (_, i) => {
  const wiggle = Math.sin(i * 0.55) * 2.4 + Math.cos(i * 0.27) * 1.6;
  const ramp = i >= 40 ? Math.pow((i - 40) / (N - 1 - 40), 1.7) * 21 : 0;
  return MEAN + wiggle + ramp;
});

const x = (i: number) => (i / (N - 1)) * W;
const y = (v: number) => H - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * H;

export function HeroDemo() {
  const [p, setP] = useState(0);
  const raf = useRef<number>();
  const start = useRef<number | null>(null);

  useEffect(() => {
    const DUR = 4200;
    const HOLD = 1100;
    const CYCLE = DUR + HOLD;
    const loop = (ts: number) => {
      if (start.current == null) start.current = ts;
      const elapsed = (ts - start.current) % CYCLE;
      setP(Math.min(1, elapsed / DUR));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const visible = Math.max(2, Math.ceil(p * N));
  const shown = SERIES.slice(0, visible);
  const line = shown.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const tipV = shown[shown.length - 1];
  const tipX = x(visible - 1);
  const tipY = y(tipV);
  const breached = tipV > UPPER;
  const z = (tipV - MEAN) / SIGMA;

  return (
    <div
      className="bg-white border rounded-xl2 p-5"
      style={{ borderColor: "var(--border)", boxShadow: "0 30px 60px -30px rgba(58,90,64,0.4)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[20px]" style={{ background: "var(--card-soft)" }}>🐄</div>
          <div>
            <div className="font-semibold text-[14px] leading-tight">Lola</div>
            <div className="text-[12px]" style={{ color: "var(--faint)" }}>ES100001 · Dairy Cow</div>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: "var(--healthy)" }} /> Live
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[200px] block">
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="#eceee3" strokeWidth="1" />
          ))}
          <rect x="0" y={y(UPPER)} width={W} height={y(LOWER) - y(UPPER)} fill="#588157" fillOpacity="0.14" />
          <line x1="0" y1={y(MEAN)} x2={W} y2={y(MEAN)} stroke="#588157" strokeWidth="2" strokeDasharray="6 6" />
          <path d={line} fill="none" stroke="#8a4f32" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          {breached && (
            <circle cx={tipX} cy={tipY} r="6" fill="#8a4f32" opacity="0.25">
              <animate attributeName="r" values="6;16;6" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0;0.35" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={tipX} cy={tipY} r="5" fill="#8a4f32" stroke="#fff" strokeWidth="2" />
        </svg>

        <div
          className="absolute top-1 right-1 flex items-center gap-1.5 text-white text-[11.5px] font-semibold px-2.5 py-1 rounded-[20px] transition-opacity duration-500"
          style={{ background: "var(--critical)", opacity: breached ? 1 : 0 }}
        >
          <AlertTriangle size={13} strokeWidth={2.5} /> Critical detected · +{z.toFixed(1)}σ
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex gap-3 text-[11.5px]" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-1.5"><span className="w-[14px]" style={{ borderTop: "2.5px solid var(--critical)" }} /> Reading</span>
          <span className="flex items-center gap-1.5"><span className="w-[14px]" style={{ borderTop: "2px dashed var(--sage)" }} /> Baseline</span>
          <span className="flex items-center gap-1.5"><span className="w-[12px] h-[10px] rounded-[3px]" style={{ background: "rgba(88,129,87,0.16)" }} /> ±2σ</span>
        </div>
        <div className="text-[12px] font-semibold" style={{ color: breached ? "var(--critical)" : "var(--muted)" }}>
          {breached ? "Vet check recommended" : "Within normal range"}
        </div>
      </div>
    </div>
  );
}
