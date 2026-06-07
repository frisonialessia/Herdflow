"use client";

// The product's headline moment, per animal: it didn't just notice the problem —
// it saw it coming. Renders the lead time (caught N hours before critical), the
// projected time-to-critical at the current trend, and the escalation timeline.

import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import type { CaseForecast } from "@/lib/forecast";
import { timeAgo } from "@/lib/format";

const fmtH = (h: number) => (h >= 48 ? `${Math.round(h / 24)}d` : `${h}h`);

export function PredictivePanel({ forecast: f }: { forecast: CaseForecast | null }) {
  if (!f) return null;

  // Pick the single most compelling headline number for this case.
  let value: string;
  let caption: string;
  if (f.alreadyCritical && f.hoursFlagToCritical && f.hoursFlagToCritical > 0) {
    value = fmtH(f.hoursFlagToCritical);
    caption = "detectado antes de volverse crítico";
  } else if (!f.alreadyCritical && f.projectionHours) {
    value = `~${fmtH(f.projectionHours)}`;
    caption = "para crítico a la tendencia actual";
  } else if (f.hoursSinceFlag && f.hoursSinceFlag > 0) {
    value = fmtH(f.hoursSinceFlag);
    caption = "ventaja de aviso anticipado";
  } else {
    value = "ahora";
    caption = "detectado en la última lectura";
  }

  const TrendIcon = f.direction === "rising" ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-[14px] p-4 mb-5" style={{ background: "var(--sage-deep)", color: "#fff" }}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} strokeWidth={2.4} color="#fff" />
        <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#cdd6c7" }}>
          Alerta temprana predictiva
        </span>
      </div>

      <div className="flex items-end gap-3">
        <div className="font-sora text-[40px] leading-none font-semibold">{value}</div>
        <div className="text-[13px] leading-tight pb-1" style={{ color: "#dfe6da" }}>{caption}</div>
      </div>

      {!f.alreadyCritical && f.projectionHours && (
        <div className="flex items-center gap-1.5 mt-2.5 text-[13px]" style={{ color: "#dfe6da" }}>
          <TrendIcon size={15} strokeWidth={2.2} />
          Tendencia → crítico en ~{fmtH(f.projectionHours)} si nada cambia.
        </div>
      )}

      {/* Escalation timeline */}
      <div className="flex items-center gap-1.5 mt-4">
        <Node label="Normal" color="var(--sage-light)" filled />
        <Bar />
        <Node
          label="Vigilancia"
          sub={f.firstFlagAt ? timeAgo(f.firstFlagAt) : undefined}
          color="var(--watch)"
          filled={!!f.firstFlagAt}
        />
        <Bar />
        <Node
          label="Crítico"
          sub={
            f.becameCriticalAt
              ? timeAgo(f.becameCriticalAt)
              : f.projectionHours
              ? `~${fmtH(f.projectionHours)}`
              : undefined
          }
          color="var(--critical)"
          filled={!!f.becameCriticalAt}
          projected={!f.becameCriticalAt && !!f.projectionHours}
        />
      </div>
    </div>
  );
}

function Node({
  label,
  sub,
  color,
  filled,
  projected,
}: {
  label: string;
  sub?: string;
  color: string;
  filled?: boolean;
  projected?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[58px]">
      <span
        className="w-3 h-3 rounded-full"
        style={{
          background: filled ? color : "transparent",
          border: `2px solid ${color}`,
          boxShadow: projected ? `0 0 0 3px rgba(138,79,50,0.35)` : "none",
        }}
      />
      <span className="text-[11px] font-semibold leading-none">{label}</span>
      <span className="text-[10px] leading-none h-[10px]" style={{ color: "#cdd6c7" }}>
        {projected ? `en ${sub}` : sub ?? ""}
      </span>
    </div>
  );
}

function Bar() {
  return <div className="flex-1 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />;
}
