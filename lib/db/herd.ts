// Server-only loader: reads the herd from Postgres and returns it in the exact
// `Animal` shape the dashboard already expects. Reuses the same z-score engine
// (computeBaseline / detectAnomaly) the demo and the worker use, so status,
// baseline and deviation are computed identically — just from real rows.
//
// Do NOT import this from a client component (it uses `pg`).
import { getPool } from "@/server/db";
import { computeBaseline, detectAnomaly } from "@/lib/anomaly";
import { SPECIES_LABEL, type Animal, type MetricKey, type MetricPoint, type Species } from "@/lib/types";

const CORE: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg"];
const metricsFor = (hasRumination: boolean): MetricKey[] =>
  hasRumination ? CORE : CORE.filter((m) => m !== "rumination_min");

// Deterministic map position from the animal id (x,y are presentation, not stored).
function position(id: string): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
  return { x: 8 + (h % 84), y: 12 + ((h >>> 8) % 76) };
}

export async function loadHerd(): Promise<Animal[]> {
  const pool = getPool();
  const animals = await pool.query<{ id: string; tag_id: string; name: string | null; species: Species; site_name: string }>(
    `select a.id, a.tag_id, a.name, a.species, s.name as site_name
       from animals a
       join sites s on s.id = a.site_id
      where a.status = 'active'`
  );

  const herd: Animal[] = [];
  for (const a of animals.rows) {
    const rows = await pool.query<{ recorded_at: Date; metric: string; value: string }>(
      `select recorded_at, metric, value from readings where animal_id = $1 order by recorded_at asc`,
      [a.id]
    );
    if (rows.rowCount === 0) continue;

    const byTime = new Map<string, MetricPoint>();
    for (const r of rows.rows) {
      const key = r.recorded_at.toISOString();
      let p = byTime.get(key);
      if (!p) {
        p = { recorded_at: key, temperature_c: 0, activity_index: 0, rumination_min: 0, intake_kg: 0, heart_rate: 0, respiration_rate: 0 };
        byTime.set(key, p);
      }
      (p as unknown as Record<string, number>)[r.metric] = Number(r.value);
    }
    const series = Array.from(byTime.values());
    if (series.length < 3) continue;

    const baseline = computeBaseline(series.slice(0, -1));
    const deviation = detectAnomaly(series, metricsFor(baseline.rumination_min > 0));
    const { x, y } = position(a.id);

    herd.push({
      id: a.id,
      tag_id: a.tag_id,
      name: a.name ?? a.tag_id,
      species: a.species,
      lot: SPECIES_LABEL[a.species],
      paddock: a.site_name,
      x,
      y,
      baseline,
      series,
      latest: series[series.length - 1],
      deviation,
      status: deviation.severity,
    });
  }

  const order = { critical: 0, watch: 1, healthy: 2 };
  return herd.sort((p, q) => order[p.status] - order[q.status]);
}
