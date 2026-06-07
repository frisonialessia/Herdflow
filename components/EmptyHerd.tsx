"use client";

// First-run screen for a fresh tenant (real mode, no animals yet). Lets the
// owner add their first animal, head to Integrations, or load a sample herd to
// explore. Shown by the overview when persisted && herd is empty.

import { useState } from "react";
import { AddAnimalButton } from "@/components/AddAnimalButton";
import { seedSampleHerdAction } from "@/app/dashboard/actions";
import { Sprout, Database } from "lucide-react";

export function EmptyHerd() {
  const [loading, setLoading] = useState(false);

  async function loadSample() {
    setLoading(true);
    try {
      await seedSampleHerdAction();
      window.location.reload(); // re-fetch the herd from the server
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <section className="animate-fade">
      <div className="bg-white border rounded-xl2 text-center py-16 px-6 max-w-[560px] mx-auto" style={{ borderColor: "var(--border)" }}>
        <div className="w-14 h-14 rounded-[16px] mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--card-soft)" }}>
          <Sprout size={26} strokeWidth={2} color="var(--sage-deep)" />
        </div>
        <h2 className="font-sora text-[20px] font-semibold">Tu hato está vacío</h2>
        <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          Agrega tu primer animal, conecta sensores desde <b>Integraciones</b>, o carga datos de ejemplo para explorar la plataforma.
        </p>
        <div className="flex gap-2.5 justify-center mt-6 flex-wrap">
          <button
            onClick={loadSample}
            disabled={loading}
            className="flex items-center gap-2 rounded-[30px] px-5 py-[11px] text-sm font-medium cursor-pointer border disabled:opacity-60"
            style={{ borderColor: "var(--border)", background: "var(--card-soft)", color: "var(--ink)" }}
          >
            <Database size={16} strokeWidth={2} color="var(--sage-deep)" /> {loading ? "Cargando…" : "Cargar datos de ejemplo"}
          </button>
          <AddAnimalButton />
        </div>
      </div>
    </section>
  );
}
