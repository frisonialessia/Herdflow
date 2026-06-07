"use client";

// "Add Animal" — opens the full add form (identity, origin/age, feeding, health)
// and creates the animal with a healthy baseline for the chosen species; the new
// animal opens in the drawer as confirmation.

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { AnimalForm } from "@/components/AnimalForm";
import { ModalShell } from "@/components/ModalShell";
import { Plus } from "lucide-react";

export function AddAnimalButton() {
  const { addAnimal } = useHerd();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-white border-0 rounded-[30px] px-5 py-[11px] text-sm font-medium cursor-pointer flex gap-2 items-center"
        style={{ background: "var(--sage-deep)" }}
      >
        <Plus size={16} strokeWidth={2} color="#fff" /> Add Animal
      </button>

      {open && (
        <ModalShell title="Agregar animal" onClose={() => setOpen(false)}>
          <AnimalForm
            mode="add"
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
