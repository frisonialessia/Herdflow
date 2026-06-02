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
    return { short: "Normal", label: "Within normal range", note: "No action needed." };
  }

  const up = a.deviation.z_score > 0;

  switch (a.deviation.metric) {
    case "temperature_c":
      return {
        short: "Fever / mastitis?",
        label: "Fever — possible mastitis or infection",
        note: "Check udder and take rectal temperature; isolate if confirmed.",
      };
    case "activity_index":
      return up
        ? {
            short: "Estrus?",
            label: "Restlessness — possible estrus (heat)",
            note: "Watch for standing heat; flag for the insemination window.",
          }
        : {
            short: "Lameness?",
            label: "Activity drop — possible lameness or illness",
            note: "Check feet and gait; inspect for injury or systemic illness.",
          };
    case "rumination_min":
      return {
        short: "Off-feed",
        label: "Low rumination — off-feed / ketosis risk",
        note: "Review ration and water access; check fresh cows for ketosis.",
      };
    case "intake_kg":
      return {
        short: "Off-feed",
        label: "Feed intake dropping — off-feed",
        note: "Check feed access and appetite; look for early illness.",
      };
    default:
      return { short: "Anomaly", label: "Deviation from baseline", note: "Review recent readings." };
  }
}
