"use client";

// Heat-stress banner: a daily THI briefing above the map. Surfaces the current
// Temperature-Humidity Index, today's projected afternoon peak, how many animals
// are at high risk and which species is most exposed, plus the mitigation to run.
// Clicking opens the most-at-risk animal. Hidden when conditions are comfortable.
//
// Time is read on the client after mount (never during render) so there is no
// server/client hydration mismatch, and it refreshes each minute to stay live.

import { useEffect, useMemo, useState } from "react";
import { ThermometerSun, Droplets, ChevronRight } from "lucide-react";
import { Animal, SPECIES_LABEL } from "@/lib/types";
import { summarizeHeat } from "@/lib/heat";

const hourLabel = (h: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${ampm}`;
};

export function HeatBanner({ herd, onSelect }: { herd: Animal[]; onSelect: (id: string) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const heat = useMemo(() => (now ? summarizeHeat(herd, now) : null), [herd, now]);
  if (!heat || heat.peakBand.key === "none") return null;

  const band = heat.peakBand; // headline severity = today's peak
  const acute = band.key === "danger" || band.key === "emergency";
  const top = heat.risks[0]?.animal;
  const peakText = heat.pastPeak
    ? `pico fue ${hourLabel(15)}`
    : heat.hoursToPeak < 1
    ? "en el pico ahora"
    : `pico ~${hourLabel(15)} (en ${Math.round(heat.hoursToPeak)} h)`;

  return (
    <button
      onClick={() => top && onSelect(top.id)}
      className="group w-full text-left relative overflow-hidden rounded-[18px] border p-4 flex items-center gap-3.5 cursor-pointer transition-shadow hover:shadow-lg mb-[18px]"
      style={{
        borderColor: band.color,
        background: acute ? "linear-gradient(100deg,#f6ece4 0%,#ffffff 70%)" : "linear-gradient(100deg,#f3f4e6 0%,#ffffff 70%)",
      }}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: band.color }} />
      <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: band.color }}>
        <ThermometerSun size={22} strokeWidth={2} color="#fff" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-[3px] rounded-[20px] text-white" style={{ background: band.color }}>
            {band.label}
          </span>
          <span className="font-sora text-[15px] font-semibold">
            THI {Math.round(heat.now.thi)} ahora · {peakText} · THI {Math.round(heat.peak.thi)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-[2px] rounded-[20px]" style={{ background: "var(--brown-soft)", color: "var(--brown)" }}>
            {Math.round(heat.now.tempC)}°C
            <Droplets size={12} strokeWidth={2.2} color="var(--brown)" /> {Math.round(heat.now.rh)}%
          </span>
        </div>
        <div className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
          {heat.atRiskCount > 0 && (
            <b style={{ color: "var(--ink)" }}>
              {heat.atRiskCount} animal{heat.atRiskCount === 1 ? "" : "es"} en alto riesgo
              {heat.topSpecies ? ` · ${SPECIES_LABEL[heat.topSpecies].toLowerCase()} más expuestas` : ""}.{" "}
            </b>
          )}
          {band.advice}
        </div>
      </div>

      <span className="flex items-center gap-1 text-[13px] font-medium shrink-0 self-center" style={{ color: band.color }}>
        {heat.atRiskCount > 0 ? `${heat.atRiskCount} en riesgo` : "Revisar"}
        <ChevronRight size={16} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
