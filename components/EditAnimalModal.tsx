"use client";

// Edit an animal's record (including its code/tag) — reuses AnimalForm in edit
// mode, plus a guarded delete. Opened from the drawer's edit button.

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { useRole } from "@/components/RoleProvider";
import { can } from "@/lib/roles";
import { AnimalForm } from "@/components/AnimalForm";
import { ModalShell } from "@/components/ModalShell";
import { Animal } from "@/lib/types";
import { profileFor } from "@/lib/profile";
import { Trash2 } from "lucide-react";

export function EditAnimalModal({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const { updateAnimal, removeAnimal } = useHerd();
  const { role } = useRole();
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <ModalShell title={`Editar · ${animal.name}`} onClose={onClose}>
      <AnimalForm
        mode="edit"
        medicalEditable={can(role, "editMedical")}
        submitLabel="Guardar cambios"
        onCancel={onClose}
        initial={{ name: animal.name, tag_id: animal.tag_id, species: animal.species, profile: profileFor(animal) }}
        onSubmit={(r) => {
          updateAnimal(animal.id, { name: r.name, tag_id: r.tag_id, profile: r.profile });
          onClose();
        }}
      />

      {can(role, "deleteAnimal") && (
      <div className="border-t mt-5 pt-4" style={{ borderColor: "var(--border)" }}>
        {!confirmDel ? (
          <button onClick={() => setConfirmDel(true)} className="flex items-center gap-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 p-0" style={{ color: "var(--brown)" }}>
            <Trash2 size={15} strokeWidth={2} /> Eliminar animal
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px]" style={{ color: "var(--ink)" }}>¿Eliminar a {animal.name} del hato?</span>
            <button onClick={() => { removeAnimal(animal.id); onClose(); }} className="text-white border-0 rounded-xl px-3.5 py-2 text-[12.5px] font-medium cursor-pointer" style={{ background: "var(--critical)" }}>
              Sí, eliminar
            </button>
            <button onClick={() => setConfirmDel(false)} className="rounded-xl px-3.5 py-2 text-[12.5px] cursor-pointer border" style={{ borderColor: "var(--border)", background: "var(--card-soft)" }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
      )}
    </ModalShell>
  );
}
