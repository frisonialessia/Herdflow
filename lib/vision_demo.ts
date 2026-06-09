// Demo image-analysis engine. Given a photo of an animal, it returns a plausible
// visual diagnosis — the same shape a real vision model (Claude vision, a fine-
// tuned CNN…) would return, so the UI and the rest of the app don't change when
// we wire the real thing. For now it's SIMULATED: deterministic from the image id
// and biased toward the animal's current sensor status, so a flagged animal's
// photo gets flagged too and the demo stays coherent. Always shown as "simulado".
//
// Pure & deterministic — no DB, no network. Swap analyzeAnimalImage's body for a
// real model call later; the VisionFinding contract is what everything depends on.

import { Severity, Species } from "./types";

export interface VisionFinding {
  condition: string; // detected (or "no lesions") — Spanish label
  area: string; // body region the model focused on
  severity: Severity; // maps onto the app's healthy/watch/critical palette
  confidence: number; // 0..100
  recommendation: string;
  differentials: string[]; // other possibilities the model weighed
  simulated: true; // honesty flag — never present this as a real diagnosis
}

type Group = "cattle" | "sheep" | "horse" | "poultry";

function groupOf(species: Species): Group {
  if (species === "dairy" || species === "beef") return "cattle";
  if (species === "sheep") return "sheep";
  if (species === "horse") return "horse";
  return "poultry";
}

interface Entry {
  condition: string;
  area: string;
  severity: Severity;
  recommendation: string;
  differentials: string[];
}

const HEALTHY: Record<Group, Entry> = {
  cattle: { condition: "Sin lesiones aparentes", area: "general", severity: "healthy", recommendation: "Pelaje, ojos y aplomos sin hallazgos. Mantener manejo normal.", differentials: [] },
  sheep: { condition: "Sin lesiones aparentes", area: "general", severity: "healthy", recommendation: "Vellón y pezuñas sin hallazgos. Mantener manejo normal.", differentials: [] },
  horse: { condition: "Sin lesiones aparentes", area: "general", severity: "healthy", recommendation: "Capa, ojos y cascos sin hallazgos. Mantener manejo normal.", differentials: [] },
  poultry: { condition: "Sin lesiones aparentes", area: "general", severity: "healthy", recommendation: "Plumaje, cresta y ojos sin hallazgos. Mantener manejo normal.", differentials: [] },
};

const DISEASES: Record<Group, Entry[]> = {
  cattle: [
    { condition: "Conjuntivitis / pink-eye", area: "ojos", severity: "watch", recommendation: "Aislar, antibiótico ocular y protección solar; muy contagioso.", differentials: ["Cuerpo extraño", "IBR"] },
    { condition: "Pododermatitis (foot rot)", area: "pezuñas", severity: "watch", recommendation: "Recorte, baño de pezuñas y antibiótico; revisar terreno húmedo.", differentials: ["Laminitis", "Absceso"] },
    { condition: "Tiña (dermatofitosis)", area: "piel", severity: "watch", recommendation: "Antifúngico tópico; zoonótico, usar guantes.", differentials: ["Sarna", "Carencias minerales"] },
    { condition: "Mastitis (cuarto inflamado)", area: "ubre", severity: "critical", recommendation: "Cultivo de leche y terapia intramamaria; separar del ordeño.", differentials: ["Edema", "Trauma"] },
    { condition: "Dermatosis nodular contagiosa", area: "piel", severity: "critical", recommendation: "Notificación obligatoria: aislar y avisar al veterinario oficial.", differentials: ["Picaduras", "Dermatofilosis"] },
  ],
  sheep: [
    { condition: "Pietín (foot rot)", area: "pezuñas", severity: "watch", recommendation: "Recorte, baño podal con sulfato de zinc y aislar cojas.", differentials: ["Absceso", "Escaldado"] },
    { condition: "Ectima contagioso (boquera)", area: "hocico / labios", severity: "watch", recommendation: "Aislar, cicatrizante; zoonótico, usar guantes.", differentials: ["Fotosensibilización", "Sarna"] },
    { condition: "Miasis (gusanera)", area: "piel / cola", severity: "critical", recommendation: "Limpiar, larvicida y curación; revisar todo el lote.", differentials: ["Herida infectada"] },
  ],
  horse: [
    { condition: "Absceso de casco", area: "casco", severity: "watch", recommendation: "Drenar, vendaje y reposo en piso seco; analgesia.", differentials: ["Laminitis", "Clavo"] },
    { condition: "Dermatitis / sarna", area: "piel", severity: "watch", recommendation: "Raspado, antiparasitario y aislar implementos.", differentials: ["Tiña", "Alergia"] },
    { condition: "Úlcera corneal", area: "ojo", severity: "critical", recommendation: "Urgencia oftálmica: tratamiento y collar; no demorar.", differentials: ["Cuerpo extraño", "Uveítis"] },
  ],
  poultry: [
    { condition: "Coriza infecciosa", area: "cara / senos", severity: "watch", recommendation: "Aislar, antibiótico y mejorar ventilación; muy contagioso.", differentials: ["Newcastle", "Bronquitis"] },
    { condition: "Signos de coccidiosis", area: "general", severity: "watch", recommendation: "Coccidiostato en agua y cama seca; revisar el lote.", differentials: ["Enteritis", "Lombrices"] },
    { condition: "Picaje / canibalismo", area: "plumaje / cloaca", severity: "watch", recommendation: "Bajar densidad y luz, revisar proteína de la dieta.", differentials: ["Ácaros", "Estrés"] },
  ],
};

// Small self-contained hash → [0,1), so the result is stable for a given image.
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

const withConfidence = (e: Entry, confidence: number): VisionFinding => ({ ...e, confidence, simulated: true });

/**
 * Simulated visual diagnosis for an animal photo.
 * @param species   the animal's species (picks the condition catalog)
 * @param statusHint the animal's current sensor status (biases the result)
 * @param seed      a stable id for the image (so re-analysis is consistent)
 */
export function analyzeAnimalImage(species: Species, statusHint: Severity, seed: string): VisionFinding {
  const group = groupOf(species);
  const diseases = DISEASES[group];
  const h = hash01(seed);

  if (statusHint === "healthy") {
    // Mostly clean, with the occasional minor (watch) incidental finding.
    if (h < 0.8) return withConfidence(HEALTHY[group], 88 + Math.round(hash01(seed + "c") * 10)); // 88–98
    const minor = diseases.filter((d) => d.severity === "watch");
    const pick = minor[Math.floor(hash01(seed + "m") * minor.length)] ?? HEALTHY[group];
    return withConfidence(pick, 60 + Math.round(hash01(seed + "c") * 15)); // 60–75
  }

  // Flagged animal: surface a finding, preferring one matching its severity.
  let pool = diseases.filter((d) => d.severity === statusHint);
  if (pool.length === 0) pool = diseases;
  const pick = pool[Math.floor(hash01(seed + "d") * pool.length)];
  return withConfidence(pick, 78 + Math.round(hash01(seed + "c") * 17)); // 78–95
}

export const SEVERITY_LABEL: Record<Severity, string> = { healthy: "Sin hallazgos", watch: "Hallazgo leve", critical: "Hallazgo grave" };
