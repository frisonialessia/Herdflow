"use client";

// Husbandry record shown in the animal drawer: breed/sex/age, origin & location,
// feeding, and the vaccination card + medical history.

import { Animal } from "@/lib/types";
import { profileFor, animalAge, SEX_LABEL } from "@/lib/profile";
import { FileText, Tag, MapPin, Utensils, Droplets, Syringe, Stethoscope } from "lucide-react";

export function ProfileCard({ animal: a }: { animal: Animal }) {
  const p = profileFor(a);

  return (
    <div className="bg-white border rounded-[14px] p-4 mb-5" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>Ficha</h3>
        <span className="ml-auto text-[12px]" style={{ color: "var(--muted)" }}>
          {p.breed || "—"} · {SEX_LABEL[p.sex]} · {animalAge(p.birthDate)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
        <Item icon={<MapPin size={13} strokeWidth={2} color="var(--brown)" />} label="Ubicación" value={p.location || "—"} />
        <Item icon={<Tag size={13} strokeWidth={2} color="var(--brown)" />} label="Procedencia" value={p.origin || "—"} />
        <Item icon={<Utensils size={13} strokeWidth={2} color="var(--brown)" />} label="Dieta" value={p.diet || "—"} />
        <Item icon={<Droplets size={13} strokeWidth={2} color="var(--brown)" />} label="Agua / día" value={p.waterIntakeL ? `${p.waterIntakeL} L` : "—"} />
        <Item icon={<Utensils size={13} strokeWidth={2} color="var(--brown)" />} label="Horarios" value={p.feedingTimes || "—"} wide />
      </div>

      <div className="border-t mt-3 pt-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1.5 mb-2 text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
          <Syringe size={13} strokeWidth={2} color="var(--sage-deep)" /> Cartilla de vacunación
        </div>
        {p.vaccines.length === 0 ? (
          <div className="text-[12.5px]" style={{ color: "var(--faint)" }}>Sin registros.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {p.vaccines.map((v, i) => (
              <div key={i} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sage)" }} /> {v.name}
                </span>
                <span style={{ color: "var(--faint)" }}>{v.date || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t mt-3 pt-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1.5 mb-1 text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
          <Stethoscope size={13} strokeWidth={2} color="var(--sage-deep)" /> Historial médico
        </div>
        <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{p.medicalHistory || "Sin antecedentes"}</div>
      </div>
    </div>
  );
}

function Item({ icon, label, value, wide }: { icon: React.ReactNode; label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide" style={{ color: "var(--faint)" }}>{icon}{label}</div>
      <div className="mt-0.5" style={{ color: "var(--ink)" }}>{value}</div>
    </div>
  );
}
