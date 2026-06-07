"use client";

// "Add Animal" — opens a small form to actually create a new animal (name +
// species) rather than spawning a random one. A healthy baseline is generated
// for the chosen species; the new animal opens in the drawer as confirmation.

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { Species, SPECIES_LABEL, SPECIES_EMOJI } from "@/lib/types";
import { Plus, X } from "lucide-react";

const SPECIES: Species[] = ["dairy", "beef", "sheep", "horse", "poultry"];

export function AddAnimalButton() {
  const { addAnimal } = useHerd();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("dairy");

  function close() {
    setOpen(false);
    setName("");
    setSpecies("dairy");
  }
  function submit() {
    addAnimal({ name: name.trim() || undefined, species });
    close();
  }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: "rgba(35,44,34,0.45)" }} onClick={close} />
          <div
            className="relative w-full max-w-[420px] bg-white border rounded-xl2 p-6"
            style={{ borderColor: "var(--border)", boxShadow: "0 30px 60px -20px rgba(58,90,64,0.5)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sora text-[18px] font-semibold">Add animal</h3>
              <button onClick={close} title="Close" className="cursor-pointer bg-transparent border-0 p-0">
                <X size={18} strokeWidth={2} color="var(--muted)" />
              </button>
            </div>

            <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--faint)" }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Rosa"
              autoFocus
              className="w-full border rounded-xl px-3 py-2.5 mt-1.5 mb-4 text-sm outline-none"
              style={{ background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
            />

            <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--faint)" }}>Species</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5 mb-5">
              {SPECIES.map((sp) => {
                const active = species === sp;
                return (
                  <button
                    key={sp}
                    onClick={() => setSpecies(sp)}
                    className="rounded-xl px-2 py-2.5 text-[12px] cursor-pointer border flex flex-col items-center gap-1 text-center leading-tight"
                    style={active ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" } : { background: "var(--card-soft)", borderColor: "var(--border)" }}
                  >
                    <span className="text-[18px]">{SPECIES_EMOJI[sp]}</span>
                    {SPECIES_LABEL[sp]}
                  </button>
                );
              })}
            </div>

            <button
              onClick={submit}
              className="w-full flex items-center justify-center gap-2 text-white border-0 rounded-xl px-4 py-2.5 text-[13px] font-medium cursor-pointer"
              style={{ background: "var(--sage-deep)" }}
            >
              <Plus size={15} strokeWidth={2} color="#fff" /> Add to herd
            </button>
            <div className="text-[12px] mt-3 text-center" style={{ color: "var(--faint)" }}>
              A healthy baseline is generated for the chosen species.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
