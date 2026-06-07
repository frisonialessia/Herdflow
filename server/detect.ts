// Detection worker (batch). Reads each animal's readings from Postgres,
// reconstructs the series, runs the SAME z-score engine as the demo
// (lib/anomaly.ts — server-side now), materialises baselines and writes
// anomalies. This is the real pipeline; run it on a schedule (cron/Inngest).
//
//   npm run db:detect
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomUUID } from "node:crypto";
import { getPool } from "./db";
import { computeBaseline, detectAnomaly } from "../lib/anomaly";
import { inferCondition } from "../lib/conditions";
import type { Animal, MetricKey, MetricPoint } from "../lib/types";

const CORE: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg"];
const ALL: MetricKey[] = [...CORE, "heart_rate", "respiration_rate"];

function metricsFor(hasRumination: boolean): MetricKey[] {
  return hasRumination ? CORE : CORE.filter((m) => m !== "rumination_min");
}

async function main() {
  const pool = getPool();
  const animals = await pool.query<{ id: string; org_id: string }>(
    `select id, org_id from animals where status = 'active'`
  );

  let scored = 0;
  let flagged = 0;
  for (const an of animals.rows) {
    const rows = await pool.query<{ recorded_at: Date; metric: string; value: string }>(
      `select recorded_at, metric, value from readings where animal_id = $1 order by recorded_at asc`,
      [an.id]
    );
    if (rows.rowCount === 0) continue;

    // pivot long → wide MetricPoint[]
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
    scored++;

    // materialise baselines (mean + stddev) per metric
    const window = series.slice(0, -1);
    for (const m of ALL) {
      const vals = window.map((p) => p[m]);
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1;
      await pool.query(
        `insert into baselines (animal_id, org_id, metric, mean, stddev, window_days)
         values ($1,$2,$3,$4,$5,14)
         on conflict (animal_id, metric) do update set mean = excluded.mean, stddev = excluded.stddev, updated_at = now()`,
        [an.id, an.org_id, m, mean, sd]
      );
    }

    if (deviation.severity !== "healthy") {
      const existing = await pool.query(
        `select 1 from anomalies where animal_id=$1 and metric=$2 and resolved=false limit 1`,
        [an.id, deviation.metric]
      );
      if (existing.rowCount === 0) {
        const cond = inferCondition({ status: deviation.severity, deviation } as Animal);
        await pool.query(
          `insert into anomalies (id, animal_id, org_id, metric, severity, z_score, baseline, observed, condition)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [randomUUID(), an.id, an.org_id, deviation.metric, deviation.severity, deviation.z_score, deviation.baseline, deviation.observed, cond.label]
        );
        flagged++;
      }
    }
  }

  console.log(`✓ Detection complete · ${scored} animals scored · ${flagged} new anomalies written`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
