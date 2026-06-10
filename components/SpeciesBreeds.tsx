// "Hecho para tus razas" — a clean, typographic showcase of the breeds HerdFlow
// already knows (per species), plus an explicit "add your own" since the breed
// field is free text. No illustrations; just names, grouped and premium. Reads
// from the same BREEDS list the add-animal form suggests, so it stays in sync.

import { BREEDS } from "@/lib/profile";
import type { Species } from "@/lib/types";
import { Plus } from "lucide-react";

const CARD =
  "bg-white rounded-xl2 border p-5 transition-all duration-200 shadow-[0_10px_30px_-18px_rgba(58,90,64,0.20)] hover:shadow-[0_22px_44px_-20px_rgba(58,90,64,0.28)] hover:-translate-y-[3px]";

const GROUPS: { sp: Species; label: string }[] = [
  { sp: "dairy", label: "Vacas lecheras" },
  { sp: "beef", label: "Ganado de carne" },
  { sp: "sheep", label: "Ovinos" },
  { sp: "horse", label: "Equinos" },
  { sp: "poultry", label: "Aves de corral" },
];

// Brown Swiss == Pardo Suizo; show the Spanish name only.
const breedsOf = (sp: Species) => BREEDS[sp].filter((b) => b !== "Brown Swiss");

export function SpeciesBreeds() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {GROUPS.map(({ sp, label }) => {
        const breeds = breedsOf(sp);
        return (
          <div key={sp} className={CARD} style={{ borderColor: "var(--border)" }}>
            <div className="flex items-baseline justify-between mb-3">
              <h4 className="font-sora text-[15px] font-semibold">{label}</h4>
              <span className="text-[12px]" style={{ color: "var(--faint)" }}>{breeds.length} razas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {breeds.map((b) => (
                <span key={b} className="text-[12.5px] px-2.5 py-1 rounded-[20px]" style={{ background: "var(--card-soft)", color: "var(--ink)" }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl2 border border-dashed p-5 flex flex-col justify-center" style={{ borderColor: "var(--sage-light)", background: "var(--card-soft)" }}>
        <div className="flex items-center gap-2 font-sora text-[15px] font-semibold" style={{ color: "var(--sage-deep)" }}>
          <Plus size={17} strokeWidth={2.4} /> ¿No está la tuya?
        </div>
        <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>
          El campo de raza es libre — agrégala en segundos. Cualquier especie o cruza que manejes cabe en HerdFlow.
        </p>
      </div>
    </div>
  );
}
