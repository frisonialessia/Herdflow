"use client";

// "Add Animal" — opens the full add form (identity, origin/age, feeding, health)
// and creates the animal with a healthy baseline for the chosen species; the new
// animal opens in the drawer as confirmation. Hidden for roles that can't add;
// disabled (with an upgrade hint) once the tenant hits its plan's animal limit.
// The server re-enforces both checks independently.

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { useRole } from "@/components/RoleProvider";
import { useEntitlements } from "@/components/EntitlementsProvider";
import { can } from "@/lib/roles";
import { AnimalForm } from "@/components/AnimalForm";
import { ModalShell } from "@/components/ModalShell";
import { Plus, Lock } from "lucide-react";

export function AddAnimalButton() {
  const { addAnimal, herd, persisted } = useHerd();
  const { role } = useRole();
  const { plan } = useEntitlements();
  const [open, setOpen] = useState(false);

  if (!can(role, "addAnimal")) return null;

  // Live usage = active animals in the herd (real mode). Demo is never capped.
  const atLimit = persisted && plan.animalLimit !== null && herd.length >= plan.animalLimit;

  if (atLimit) {
    return (
      <button
        disabled
        title={`Llegaste al límite del plan ${plan.name} (${plan.animalLimit} animales). Mejora tu plan para agregar más.`}
        className="rounded-[30px] px-5 py-[11px] text-sm font-medium flex gap-2 items-center cursor-not-allowed border"
        style={{ background: "var(--card-soft)", color: "var(--muted)", borderColor: "var(--border)" }}
      >
        <Lock size={15} strokeWidth={2} color="var(--muted)" /> Plan {plan.name} · {herd.length}/{plan.animalLimit}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-white border-0 rounded-[30px] px-5 py-[11px] text-sm font-medium cursor-pointer flex gap-2 items-center"
        style={{ background: "var(--sage-deep)" }}
      >
        <Plus size={16} strokeWidth={2} color="#fff" /> Agregar animal
      </button>

      {open && (
        <ModalShell title="Agregar animal" onClose={() => setOpen(false)}>
          <AnimalForm
            mode="add"
            medicalEditable={can(role, "editMedical")}
            submitLabel="Agregar al hato"
            onCancel={() => setOpen(false)}
            onSubmit={(r) => {
              addAnimal({ name: r.name, tag_id: r.tag_id, species: r.species, profile: r.profile });
              setOpen(false);
            }}
          />
        </ModalShell>
      )}
    </>
  );
}
