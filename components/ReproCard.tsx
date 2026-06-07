"use client";

// Reproduction card in the animal drawer (breedable females only). Shows where
// she is in her cycle and — when she's in standing heat — the insemination
// window with a one-tap "Mark bred". Mirrors the breeding board, scoped to one
// animal.

import { useHerd } from "@/components/HerdProvider";
import { Animal } from "@/lib/types";
import { reproOf, aiWindow, isBreedable, dimText } from "@/lib/repro";
import { calvingOf, calvingLabel, BUCKET_COLOR } from "@/lib/calving";
import { HeartPulse, Syringe, CalendarDays, Check, CircleDot } from "lucide-react";

export function ReproCard({ animal: a }: { animal: Animal }) {
  const { bred, markBred } = useHerd();
  if (!isBreedable(a)) return null;
  const justBred = !!bred[a.id];
  const r = reproOf(a, justBred);
  if (!r) return null;

  const Shell = ({ accent, children }: { accent: string; children: React.ReactNode }) => (
    <div className="rounded-[14px] p-4 mb-5" style={{ background: "var(--card)", border: `1px solid ${accent}` }}>
      <div className="flex items-center gap-2 mb-2">
        <HeartPulse size={16} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>Reproducción</h3>
        <span className="ml-auto text-[12px]" style={{ color: "var(--faint)" }}>{dimText(a.species, r.dim)}</span>
      </div>
      {children}
    </div>
  );

  if (r.status === "in_heat") {
    const win = aiWindow(r.onsetHoursAgo ?? 6);
    return (
      <Shell accent="var(--sage)">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-[3px] rounded-[20px] text-white" style={{ background: "var(--sage-deep)" }}>
            <HeartPulse size={12} strokeWidth={2.4} color="#fff" /> En celo
          </span>
          <span className="text-[12px] font-semibold px-2 py-[2px] rounded-[20px]" style={{ background: "var(--card-soft)", color: "var(--muted)" }}>
            confianza {r.confidence} · {r.detectedBy === "activity" ? "pico de actividad" : "ciclo"}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full" style={{ width: `${r.intensity ?? 0}%`, background: "var(--sage-deep)" }} />
          </div>
          <span className="font-sora text-[13px] font-semibold tabular-nums">{r.intensity}</span>
        </div>
        <div className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
          Inicio hace ~{r.onsetHoursAgo} h · <span style={{ color: win.color, fontWeight: 600 }}>{win.label}</span>
        </div>
        <button
          onClick={() => markBred(a.id)}
          className="w-full flex items-center justify-center gap-2 text-white border-0 rounded-[12px] py-2.5 text-[13px] font-medium cursor-pointer"
          style={{ background: "var(--sage-deep)" }}
        >
          <Syringe size={15} strokeWidth={2.2} color="#fff" /> Marcar servida
        </button>
      </Shell>
    );
  }

  if (r.status === "bred") {
    return (
      <Shell accent="var(--brown-soft)">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Check size={16} strokeWidth={2.4} color="var(--sage-deep)" />
          {justBred ? "Servida marcada" : "Servida"} · confirmar preñez en ~30 d
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>Programa una revisión de preñez; vigila un retorno al celo a los ~21 días.</div>
      </Shell>
    );
  }

  if (r.status === "approaching") {
    return (
      <Shell accent="var(--watch)">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <CalendarDays size={16} strokeWidth={2.2} color="var(--brown)" />
          Próxima al celo — en ~{r.daysToHeat} d
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>Vigila el celo en pie y el aumento de actividad en las próximas 48 horas.</div>
      </Shell>
    );
  }

  if (r.status === "pregnant") {
    const c = calvingOf(a);
    return (
      <Shell accent="var(--brown-soft)">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Check size={16} strokeWidth={2.4} color="var(--healthy)" /> Preñez confirmada
        </div>
        {c ? (
          <>
            <div className="flex items-center gap-2.5 mt-2.5">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round((c.gestationDay / c.gestation) * 100)}%`, background: BUCKET_COLOR[c.bucket] }} />
              </div>
              <span className="text-[12px] tabular-nums" style={{ color: "var(--muted)" }}>día {c.gestationDay}/{c.gestation}</span>
            </div>
            <div className="text-[12.5px] mt-1.5" style={{ color: "var(--muted)" }}>
              <span style={{ color: BUCKET_COLOR[c.bucket], fontWeight: 600 }}>{calvingLabel(c.daysToCalving)}</span> · parto previsto
            </div>
          </>
        ) : (
          <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>Sin acción — no se espera que cicle.</div>
        )}
      </Shell>
    );
  }

  // open
  return (
    <Shell accent="var(--border)">
      <div className="flex items-center gap-2 text-[14px] font-semibold">
        <CircleDot size={15} strokeWidth={2.2} color="var(--muted)" /> Vacía · ciclando
      </div>
      <div className="text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>Próximo celo en ~{r.daysToHeat} d (ciclo ≈21 días).</div>
    </Shell>
  );
}
