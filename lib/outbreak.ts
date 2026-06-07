// Outbreak / cluster detection — the biosecurity layer on top of the per-animal
// z-score engine. A single sick animal is a case; several sick animals close
// together showing the SAME deviated metric is a pattern with a shared cause:
// an infection spreading, contaminated feed/water, or a localized stressor.
//
// Pure and deterministic (like lib/anomaly.ts): it takes the herd and returns
// the clusters, so the map overlay, the banner and any server job agree.

import { Animal, MetricKey } from "./types";

export interface Outbreak {
  id: string;
  metric: MetricKey;
  animalIds: string[];
  size: number;
  criticalCount: number;
  severity: "watch" | "critical";
  cx: number; // centroid x (0–100 % of the map)
  cy: number; // centroid y (0–100 %)
  radius: number; // % radius to draw the hot zone
  paddock: string; // dominant paddock among members
  short: string; // map badge, e.g. "Fever"
  label: string; // e.g. "Fever cluster"
  note: string; // suggested action
}

// Two sick animals within this distance (% of the map) are "neighbors". A
// cluster has to be both broad (≥ MIN_SIZE animals deviating together) and
// genuinely severe (≥ MIN_CRITICAL of them critical) before we call it an
// outbreak — so scattered watch-level noise never cries wolf.
const NEIGHBOR_RADIUS = 22;
const MIN_SIZE = 3;
const MIN_CRITICAL = 2;

const dist = (a: Animal, b: Animal) => Math.hypot(a.x - b.x, a.y - b.y);

// Single-linkage spatial clustering via union-find.
function spatialClusters(animals: Animal[]): Animal[][] {
  const parent = animals.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < animals.length; i++) {
    for (let j = i + 1; j < animals.length; j++) {
      if (dist(animals[i], animals[j]) <= NEIGHBOR_RADIUS) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, Animal[]>();
  animals.forEach((a, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) g.push(a);
    else groups.set(root, [a]);
  });
  return [...groups.values()];
}

function dominantPaddock(group: Animal[]): string {
  const counts = new Map<string, number>();
  for (const a of group) counts.set(a.paddock, (counts.get(a.paddock) ?? 0) + 1);
  return [...counts.entries()].sort((x, y) => y[1] - x[1])[0][0];
}

function meta(metric: MetricKey, paddock: string): { short: string; label: string; note: string } {
  switch (metric) {
    case "temperature_c":
      return {
        short: "Fiebre",
        label: "Brote de fiebre",
        note: `Varios animales con fiebre en ${paddock}. Posible brote infeccioso o respiratorio — aísla este grupo y llama al veterinario.`,
      };
    case "respiration_rate":
      return {
        short: "Respiratorio",
        label: "Brote respiratorio",
        note: `Varios animales respirando con dificultad en ${paddock}. Posible enfermedad respiratoria (p. ej. neumonía / BRD) — aísla y ventila.`,
      };
    case "rumination_min":
    case "intake_kg":
      return {
        short: "Inapetencia",
        label: "Brote de inapetencia",
        note: `Varios animales inapetentes en ${paddock}. Revisa el alimento y el agua de ese corral por descomposición o contaminación.`,
      };
    case "activity_index":
      return {
        short: "Actividad baja",
        label: "Brote de caída de actividad",
        note: `Varios animales decaídos en ${paddock}. Revisa el área por un peligro, estrés calórico o un factor de estrés compartido.`,
      };
    default:
      return {
        short: "Anomalía",
        label: "Brote de anomalía",
        note: `Un grupo de animales en ${paddock} se está desviando en conjunto — vale la pena revisarlo.`,
      };
  }
}

/** Detect outbreak clusters across the herd. Returns largest-first. */
export function detectOutbreaks(herd: Animal[]): Outbreak[] {
  const sick = herd.filter((a) => a.status !== "healthy");

  // Group by the deviated metric, then cluster each group spatially.
  const byMetric = new Map<MetricKey, Animal[]>();
  for (const a of sick) {
    const g = byMetric.get(a.deviation.metric);
    if (g) g.push(a);
    else byMetric.set(a.deviation.metric, [a]);
  }

  const out: Outbreak[] = [];
  for (const [metric, animals] of byMetric) {
    for (const group of spatialClusters(animals)) {
      const criticalCount = group.filter((a) => a.status === "critical").length;
      if (group.length < MIN_SIZE || criticalCount < MIN_CRITICAL) continue;
      const cx = group.reduce((s, a) => s + a.x, 0) / group.length;
      const cy = group.reduce((s, a) => s + a.y, 0) / group.length;
      const radius = Math.max(...group.map((a) => Math.hypot(a.x - cx, a.y - cy))) + 6;
      const paddock = dominantPaddock(group);
      const m = meta(metric, paddock);
      out.push({
        id: "ob-" + group.map((a) => a.id).sort().join("-"),
        metric,
        animalIds: group.map((a) => a.id),
        size: group.length,
        criticalCount,
        severity: criticalCount > 0 ? "critical" : "watch",
        cx,
        cy,
        radius,
        paddock,
        short: m.short,
        label: m.label,
        note: m.note,
      });
    }
  }
  return out.sort((a, b) => b.size - a.size);
}
