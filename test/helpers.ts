// Fixtures for the pure-logic unit tests. `animalWith` builds a fully-typed
// Animal with sensible defaults so each test only sets the fields it cares about
// (species, deviation, status, series…). `metricSeries` builds a reading series
// for one metric on a fixed clock, so anything time-derived stays deterministic.
import type { Animal, Baseline, Deviation, MetricKey, MetricPoint, Severity, Species } from "@/lib/types";

const NEUTRAL: Omit<MetricPoint, "recorded_at"> = {
  temperature_c: 38.5,
  activity_index: 60,
  rumination_min: 480,
  intake_kg: 11,
  heart_rate: 65,
  respiration_rate: 28,
};

// Fixed reference instant so recorded_at strings are stable across runs.
const T0 = Date.UTC(2026, 0, 1, 0, 0, 0);

/** A reading series carrying `values` on `metric` (others held at neutral),
 *  spaced `stepHrs` apart and ending at the fixed reference instant. */
export function metricSeries(metric: MetricKey, values: number[], stepHrs = 4): MetricPoint[] {
  const n = values.length;
  return values.map((v, i) => ({
    ...NEUTRAL,
    recorded_at: new Date(T0 - (n - 1 - i) * stepHrs * 3_600_000).toISOString(),
    [metric]: v,
  })) as MetricPoint[];
}

const DEFAULT_BASELINE: Baseline = { ...NEUTRAL };

export function animalWith(o: Partial<Animal> & { species?: Species } = {}): Animal {
  const species: Species = o.species ?? "dairy";
  const series = o.series ?? metricSeries("temperature_c", Array(16).fill(38.5));
  const deviation: Deviation =
    o.deviation ?? { metric: "temperature_c", z_score: 0, baseline: 38.5, observed: 38.5, severity: "healthy" };
  const status: Severity = o.status ?? deviation.severity;
  return {
    id: o.id ?? "test-1",
    tag_id: o.tag_id ?? "ES999",
    name: o.name ?? "Prueba",
    species,
    lot: o.lot ?? species,
    paddock: o.paddock ?? "Pasture A",
    x: o.x ?? 50,
    y: o.y ?? 50,
    baseline: o.baseline ?? DEFAULT_BASELINE,
    series,
    latest: o.latest ?? series[series.length - 1],
    deviation,
    status,
    profile: o.profile,
  };
}
