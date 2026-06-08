// Server-only loader: reads the herd from Postgres and returns it in the exact
// `Animal` shape the dashboard already expects.
//
// Two design choices worth calling out:
//   • No N+1 — every per-animal concern (readings, vaccines, baselines,
//     anomalies) is fetched in a single batched query keyed by animal_id, then
//     assembled in memory. One page load = a handful of queries, not O(herd).
//   • Single source of truth — when the detection worker (server/detect.ts) has
//     run, we use the baselines/anomalies it materialised (the same numbers that
//     drove the alerts), so the dashboard and the notifications never disagree.
//     Before the worker runs (a freshly-seeded tenant), we fall back to the live
//     z-score engine so the herd still scores correctly on first load.
//
// Do NOT import this from a client component (it uses `pg`).
import { getPool } from "@/server/db";
import { computeBaseline, detectAnomaly } from "@/lib/anomaly";
import {
  SPECIES_LABEL,
  type Animal,
  type AnimalProfile,
  type Baseline,
  type CaseState,
  type CaseStatus,
  type Deviation,
  type MetricKey,
  type MetricPoint,
  type Severity,
  type Species,
  type VaccineRecord,
} from "@/lib/types";
import type { LogEntry, HistoryKind } from "@/lib/history";

const isoDate = (d: Date) => new Date(d).toISOString().slice(0, 10);

const ALL_METRICS: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate"];
const CORE: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg"];
const metricsFor = (hasRumination: boolean): MetricKey[] =>
  hasRumination ? CORE : CORE.filter((m) => m !== "rumination_min");

// Deterministic map position from the animal id (x,y are presentation, not stored).
function position(id: string): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
  return { x: 8 + (h % 84), y: 12 + ((h >>> 8) % 76) };
}

// Tenant scoping (application-level mirror of the schema's RLS): an animal is
// visible if its org is one the user belongs to, or one that granted access to
// an org the user belongs to (coop / vet delegation). When this app moves onto
// Supabase, the same predicate is enforced in the DB by app_accessible_org_ids().
const ACCESSIBLE_ORGS = `
  a.org_id in (
    select org_id from memberships where user_id = $1
    union
    select g.grantor_org_id
      from access_grants g
      join memberships m on m.org_id = g.grantee_org_id
     where m.user_id = $1 and g.status = 'active'
  )`;

// ── Batched sub-loaders (each is one query for the whole herd) ───────────────

async function loadVaccinations(ids: string[]): Promise<Map<string, VaccineRecord[]>> {
  const map = new Map<string, VaccineRecord[]>();
  if (!ids.length) return map;
  const vax = await getPool().query<{ animal_id: string; name: string; applied_on: Date | null }>(
    `select animal_id, name, applied_on from vaccinations
      where animal_id = any($1::uuid[]) order by applied_on desc nulls last`,
    [ids]
  );
  for (const v of vax.rows) {
    const arr = map.get(v.animal_id) ?? [];
    arr.push({ name: v.name, date: v.applied_on ? isoDate(v.applied_on) : "" });
    map.set(v.animal_id, arr);
  }
  return map;
}

/** All readings for the herd, pivoted long → wide into a MetricPoint series per animal. */
async function loadSeriesByAnimal(ids: string[]): Promise<Map<string, MetricPoint[]>> {
  const out = new Map<string, MetricPoint[]>();
  if (!ids.length) return out;
  const rows = await getPool().query<{ animal_id: string; recorded_at: Date; metric: string; value: string }>(
    `select animal_id, recorded_at, metric, value from readings
      where animal_id = any($1::uuid[]) order by animal_id, recorded_at asc`,
    [ids]
  );
  const byAnimalTime = new Map<string, Map<string, MetricPoint>>();
  for (const r of rows.rows) {
    let times = byAnimalTime.get(r.animal_id);
    if (!times) {
      times = new Map();
      byAnimalTime.set(r.animal_id, times);
    }
    const key = r.recorded_at.toISOString();
    let p = times.get(key);
    if (!p) {
      p = { recorded_at: key, temperature_c: 0, activity_index: 0, rumination_min: 0, intake_kg: 0, heart_rate: 0, respiration_rate: 0 };
      times.set(key, p);
    }
    (p as unknown as Record<string, number>)[r.metric] = Number(r.value);
  }
  for (const [animalId, times] of byAnimalTime) out.set(animalId, Array.from(times.values()));
  return out;
}

/** The worker's materialised per-metric baseline means, keyed by animal. */
async function loadDbBaselines(ids: string[]): Promise<Map<string, Partial<Baseline>>> {
  const map = new Map<string, Partial<Baseline>>();
  if (!ids.length) return map;
  const rows = await getPool().query<{ animal_id: string; metric: string; mean: string }>(
    `select animal_id, metric, mean from baselines where animal_id = any($1::uuid[])`,
    [ids]
  );
  for (const r of rows.rows) {
    if (!(ALL_METRICS as string[]).includes(r.metric)) continue;
    const b = map.get(r.animal_id) ?? {};
    (b as Record<string, number>)[r.metric] = Number(r.mean);
    map.set(r.animal_id, b);
  }
  return map;
}

/** The single most-severe OPEN anomaly per animal, as a ready-to-use Deviation. */
async function loadOpenAnomalies(ids: string[]): Promise<Map<string, Deviation>> {
  const map = new Map<string, Deviation>();
  if (!ids.length) return map;
  const rows = await getPool().query<{
    animal_id: string; metric: string; severity: Severity; z_score: string; baseline: string | null; observed: string | null;
  }>(
    `select distinct on (animal_id) animal_id, metric, severity, z_score, baseline, observed
       from anomalies
      where resolved = false and animal_id = any($1::uuid[])
      order by animal_id,
        case severity when 'critical' then 0 when 'watch' then 1 else 2 end,
        abs(z_score) desc`,
    [ids]
  );
  for (const r of rows.rows) {
    map.set(r.animal_id, {
      metric: r.metric as MetricKey,
      z_score: Number(r.z_score),
      baseline: r.baseline != null ? Number(r.baseline) : 0,
      observed: r.observed != null ? Number(r.observed) : 0,
      severity: r.severity,
    });
  }
  return map;
}

export async function loadHerd(userId: string): Promise<Animal[]> {
  const pool = getPool();
  const animals = await pool.query<{
    id: string; tag_id: string; name: string | null; species: Species; site_name: string;
    sex: string | null; breed: string | null; birth_date: Date | null; origin: string | null; location: string | null;
    diet: string | null; feeding_times: string | null; water_l: string | null; medical_history: string | null;
  }>(
    `select a.id, a.tag_id, a.name, a.species, s.name as site_name,
            a.sex, a.breed, a.birth_date, a.origin, a.location, a.diet, a.feeding_times, a.water_l, a.medical_history
       from animals a
       join sites s on s.id = a.site_id
      where a.status = 'active' and ${ACCESSIBLE_ORGS}`,
    [userId]
  );
  const ids = animals.rows.map((r) => r.id);
  if (ids.length === 0) return [];

  // One batched query per concern — no N+1 over the herd.
  const [vaxByAnimal, seriesByAnimal, dbBaselineByAnimal, openAnomalyByAnimal] = await Promise.all([
    loadVaccinations(ids),
    loadSeriesByAnimal(ids),
    loadDbBaselines(ids),
    loadOpenAnomalies(ids),
  ]);

  const herd: Animal[] = [];
  for (const a of animals.rows) {
    const series = seriesByAnimal.get(a.id);
    if (!series || series.length < 3) continue;

    const computedBaseline = computeBaseline(series.slice(0, -1));
    const metrics = metricsFor(computedBaseline.rumination_min > 0);

    // Prefer the worker's outputs (consistent with the dispatched alerts); fall
    // back to the live z-score engine when the worker hasn't scored this animal.
    const dbMeans = dbBaselineByAnimal.get(a.id);
    const baseline: Baseline = dbMeans ? { ...computedBaseline, ...dbMeans } : computedBaseline;
    const deviation: Deviation = openAnomalyByAnimal.get(a.id) ?? detectAnomaly(series, metrics);

    const { x, y } = position(a.id);
    const hasFicha = a.sex != null || a.breed != null || a.birth_date != null;
    const profile: AnimalProfile | undefined = hasFicha
      ? {
          sex: a.sex === "male" ? "male" : "female",
          breed: a.breed ?? "",
          birthDate: a.birth_date ? isoDate(a.birth_date) : "",
          origin: a.origin ?? "",
          location: a.location ?? "",
          diet: a.diet ?? "",
          feedingTimes: a.feeding_times ?? "",
          waterIntakeL: a.water_l != null ? Number(a.water_l) : 0,
          vaccines: vaxByAnimal.get(a.id) ?? [],
          medicalHistory: a.medical_history ?? "Sin antecedentes",
        }
      : undefined;

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
      profile,
    });
  }

  const order = { critical: 0, watch: 1, healthy: 2 };
  return herd.sort((p, q) => order[p.status] - order[q.status]);
}

const ISO = (d: Date) => new Date(d).toISOString();

export interface OperationalState {
  cases: Record<string, CaseState>;
  bred: Record<string, string>;
  log: Record<string, LogEntry[]>;
}

/** Read back the persisted operational state (case workflow, breeding marks,
 * history log) so it survives a reload in real mode. */
export async function loadOperationalState(userId: string): Promise<OperationalState> {
  const pool = getPool();
  const ORG = `org_id in (
    select org_id from memberships where user_id = $1
    union
    select g.grantor_org_id from access_grants g join memberships m on m.org_id = g.grantee_org_id
     where m.user_id = $1 and g.status = 'active')`;

  const caseRows = await pool.query<{ animal_id: string; status: CaseStatus; assignee: string | null }>(
    `select animal_id, status, assignee from cases where ${ORG}`,
    [userId]
  );
  const cases: Record<string, CaseState> = {};
  for (const c of caseRows.rows) cases[c.animal_id] = { status: c.status, assignee: c.assignee, events: [] };

  const evRows = await pool.query<{ animal_id: string; at: Date; label: string }>(
    `select c.animal_id, ce.at, ce.label from case_events ce join cases c on c.id = ce.case_id where ce.${ORG} order by ce.at asc`,
    [userId]
  );
  for (const e of evRows.rows) cases[e.animal_id]?.events.push({ at: ISO(e.at), label: e.label });

  const bredRows = await pool.query<{ animal_id: string; at: Date }>(
    `select distinct on (animal_id) animal_id, at from breeding_events where ${ORG} order by animal_id, at desc`,
    [userId]
  );
  const bred: Record<string, string> = {};
  for (const b of bredRows.rows) bred[b.animal_id] = ISO(b.at);

  const logRows = await pool.query<{ animal_id: string; at: Date; kind: string; title: string; detail: string | null }>(
    `select animal_id, at, kind, title, detail from animal_events where ${ORG} order by at asc`,
    [userId]
  );
  const log: Record<string, LogEntry[]> = {};
  for (const l of logRows.rows) {
    (log[l.animal_id] ??= []).push({ at: ISO(l.at), kind: l.kind as HistoryKind, title: l.title, detail: l.detail ?? undefined });
  }

  return { cases, bred, log };
}
