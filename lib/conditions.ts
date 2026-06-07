// Maps a detected deviation to a likely livestock condition. This turns the raw
// z-score signal into something a farmer/vet can act on. Heuristic and
// illustrative — a real product would validate these against vet diagnoses.

import { Animal } from "./types";

export interface Condition {
  short: string; // chip label, e.g. "Estrus?"
  label: string; // full description
  note: string; // suggested action
}

export function inferCondition(a: Animal): Condition {
  if (a.status === "healthy") {
    return { short: "Normal", label: "Dentro del rango normal", note: "Sin acción necesaria." };
  }

  const up = a.deviation.z_score > 0;

  switch (a.deviation.metric) {
    case "temperature_c":
      return {
        short: "¿Fiebre / mastitis?",
        label: "Fiebre — posible mastitis o infección",
        note: "Revisa la ubre y toma temperatura rectal; aísla si se confirma.",
      };
    case "activity_index":
      return up
        ? {
            short: "¿Celo?",
            label: "Inquietud — posible celo",
            note: "Vigila el celo en pie; marca para la ventana de inseminación.",
          }
        : {
            short: "¿Cojera?",
            label: "Caída de actividad — posible cojera o enfermedad",
            note: "Revisa patas y andar; inspecciona por lesión o enfermedad sistémica.",
          };
    case "rumination_min":
      return {
        short: "Inapetente",
        label: "Rumia baja — inapetencia / riesgo de cetosis",
        note: "Revisa la ración y el acceso al agua; checa cetosis en vacas recién paridas.",
      };
    case "intake_kg":
      return {
        short: "Inapetente",
        label: "Consumo bajando — inapetencia",
        note: "Revisa acceso al alimento y apetito; busca enfermedad temprana.",
      };
    default:
      return { short: "Anomalía", label: "Desviación de la línea base", note: "Revisa las lecturas recientes." };
  }
}
