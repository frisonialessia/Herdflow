// Domain types shared across the app

export type Species = "dairy" | "beef" | "sheep" | "horse" | "poultry";
export type Severity = "healthy" | "watch" | "critical";
export type MetricKey = "temperature_c" | "activity_index" | "rumination_min" | "intake_kg";

export interface MetricPoint {
  recorded_at: string; // ISO
  temperature_c: number;
  activity_index: number;
  rumination_min: number;
  intake_kg: number;
}

export interface Baseline {
  temperature_c: number;
  activity_index: number;
  rumination_min: number;
  intake_kg: number;
}

export interface Deviation {
  metric: MetricKey;
  z_score: number;
  baseline: number;
  observed: number;
  severity: Severity;
}

export interface Animal {
  id: string;
  tag_id: string;
  name: string;
  species: Species;
  lot: string;
  paddock: string;
  // map position (0-100 % of the pasture viewport)
  x: number;
  y: number;
  baseline: Baseline;
  series: MetricPoint[];
  latest: MetricPoint;
  deviation: Deviation;
  status: Severity;
}

export const SPECIES_LABEL: Record<Species, string> = {
  dairy: "Dairy Cow",
  beef: "Beef",
  sheep: "Sheep",
  horse: "Horse",
  poultry: "Poultry",
};

export const SPECIES_EMOJI: Record<Species, string> = {
  dairy: "🐄",
  beef: "🐂",
  sheep: "🐑",
  horse: "🐎",
  poultry: "🐔",
};

// Species-specific normal ranges (mean reference values)
export const SPECIES_NORMS: Record<Species, Baseline> = {
  dairy:   { temperature_c: 38.5, activity_index: 60, rumination_min: 480, intake_kg: 11 },
  beef:    { temperature_c: 38.6, activity_index: 58, rumination_min: 450, intake_kg: 10 },
  sheep:   { temperature_c: 39.1, activity_index: 56, rumination_min: 430, intake_kg: 4 },
  horse:   { temperature_c: 37.8, activity_index: 65, rumination_min: 0,   intake_kg: 9 },
  poultry: { temperature_c: 41.2, activity_index: 70, rumination_min: 0,   intake_kg: 0.12 },
};
