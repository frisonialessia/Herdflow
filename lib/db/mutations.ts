// Server-only write layer: persists the operational state (animal CRUD, the
// case workflow, breeding) to Postgres, org-scoped to the acting user. Mirrors
// the in-memory provider logic so demo and real mode behave identically.
//
// Do NOT import from a client component (uses `pg`). Reached only via the server
// actions in app/dashboard/actions.ts.
import { getPool } from "@/server/db";
import { generateAnimal } from "@/lib/mock_data_generator";
import { SPECIES_LABEL, type Animal, type AnimalProfile, type CaseStatus, type MetricKey, type Species } from "@/lib/types";

const METRICS: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate"];

const CASE_EVENT_LABEL: Record<CaseStatus, string> = {
  open: "Reabierto",
  acknowledged: "Reconocido",
  treating: "Tratamiento iniciado",
  resolved: "Resuelto",
};

// Application-level mirror of the schema's RLS predicate.
const ACCESSIBLE = `
  org_id in (
    select org_id from memberships where user_id = $1
    union
    select g.grantor_org_id from access_grants g
      join memberships m on m.org_id = g.grantee_org_id
     where m.user_id = $1 and g.status = 'active'
  )`;

export interface AnimalInput {
  name?: string;
  tag_id?: string;
  species?: Species;
  profile?: Partial<AnimalProfile>;
}
export interface AnimalPatch {
  name?: string;
  tag_id?: string;
  profile?: Partial<AnimalProfile>;
}

async function userOrgSite(userId: string) {
  const pool = getPool();
  const r = await pool.query<{ org_id: string; site_id: string; site_name: string }>(
    `select m.org_id, s.id as site_id, s.name as site_name
       from memberships m join sites s on s.org_id = m.org_id
      where m.user_id = $1
      order by m.created_at asc, s.created_at asc
      limit 1`,
    [userId]
  );
  return r.rows[0] ?? null;
}

/** The animal's org if this user may write it, else null. */
async function animalOrg(userId: string, animalId: string): Promise<string | null> {
  const pool = getPool();
  const r = await pool.query<{ org_id: string }>(`select org_id from animals where id = $2 and ${ACCESSIBLE}`, [userId, animalId]);
  return r.rows[0]?.org_id ?? null;
}

/** Create an animal (with a starter series so it shows up immediately). Returns
 * the full Animal so the client can add it to local state with its real id. */
export async function createAnimal(userId: string, input: AnimalInput): Promise<Animal | null> {
  const pool = getPool();
  const loc = await userOrgSite(userId);
  if (!loc) return null;

  const a = generateAnimal(Date.now() % 100000, Date.now(), { name: input.name, species: input.species });
  const profile: AnimalProfile = { ...(a.profile as AnimalProfile), ...input.profile };
  const tag = (input.tag_id || "").trim() || `ES${Date.now().toString().slice(-6)}`;

  const client = await pool.connect();
  try {
    await client.query("begin");
    const ins = await client.query<{ id: string }>(
      `insert into animals (org_id, site_id, tag_id, species, name,
                            sex, breed, birth_date, origin, location, diet, feeding_times, water_l, medical_history)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
      [loc.org_id, loc.site_id, tag, a.species, a.name,
       profile.sex, profile.breed, profile.birthDate || null, profile.origin, profile.location, profile.diet, profile.feedingTimes, profile.waterIntakeL, profile.medicalHistory]
    );
    const id = ins.rows[0].id;

    const ts: string[] = [], ms: string[] = [], vs: number[] = [];
    for (const p of a.series) for (const m of METRICS) { ts.push(p.recorded_at); ms.push(m); vs.push(p[m] as number); }
    await client.query(
      `insert into readings (animal_id, org_id, recorded_at, metric, value)
       select $1,$2,t.recorded_at,t.metric,t.value from unnest($3::timestamptz[],$4::text[],$5::float8[]) as t(recorded_at,metric,value)`,
      [id, loc.org_id, ts, ms, vs]
    );
    for (const v of profile.vaccines) {
      await client.query(`insert into vaccinations (animal_id, org_id, name, applied_on) values ($1,$2,$3,$4)`, [id, loc.org_id, v.name, v.date || null]);
    }
    await client.query(
      `insert into animal_events (animal_id, org_id, kind, title, detail) values ($1,$2,'enrolled','Alta en la plataforma','Animal agregado al hato')`,
      [id, loc.org_id]
    );
    await client.query("commit");

    return { ...a, id, tag_id: tag, name: a.name, lot: SPECIES_LABEL[a.species], paddock: loc.site_name, profile, status: a.deviation.severity };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateAnimal(userId: string, id: string, patch: AnimalPatch): Promise<void> {
  const pool = getPool();
  const org = await animalOrg(userId, id);
  if (!org) return;
  const p = patch.profile;
  await pool.query(
    `update animals set
        name = coalesce($3, name),
        tag_id = coalesce($4, tag_id),
        sex = coalesce($5, sex), breed = coalesce($6, breed), birth_date = coalesce($7, birth_date),
        origin = coalesce($8, origin), location = coalesce($9, location), diet = coalesce($10, diet),
        feeding_times = coalesce($11, feeding_times), water_l = coalesce($12, water_l), medical_history = coalesce($13, medical_history)
      where id = $2 and org_id = $1`,
    [org, id, patch.name ?? null, patch.tag_id ?? null,
     p?.sex ?? null, p?.breed ?? null, p?.birthDate || null, p?.origin ?? null, p?.location ?? null, p?.diet ?? null,
     p?.feedingTimes ?? null, p?.waterIntakeL ?? null, p?.medicalHistory ?? null]
  );
  if (p?.vaccines) {
    await pool.query(`delete from vaccinations where animal_id = $1`, [id]);
    for (const v of p.vaccines) await pool.query(`insert into vaccinations (animal_id, org_id, name, applied_on) values ($1,$2,$3,$4)`, [id, org, v.name, v.date || null]);
  }
  await pool.query(`insert into animal_events (animal_id, org_id, kind, title) values ($1,$2,'edit','Ficha actualizada')`, [id, org]);
}

export async function removeAnimal(userId: string, id: string): Promise<void> {
  const pool = getPool();
  await pool.query(`delete from animals where id = $2 and ${ACCESSIBLE}`, [userId, id]);
}

async function upsertCase(userId: string, id: string, set: string, params: unknown[], label: string): Promise<void> {
  const org = await animalOrg(userId, id);
  if (!org) return;
  const pool = getPool();
  const c = await pool.query<{ id: string }>(
    `insert into cases (animal_id, org_id, status) values ($1,$2,'open')
       on conflict (animal_id) do update set ${set}, updated_at = now() returning id`,
    [id, org, ...params]
  );
  await pool.query(`insert into case_events (case_id, org_id, label) values ($1,$2,$3)`, [c.rows[0].id, org, label]);
  await pool.query(`insert into animal_events (animal_id, org_id, kind, title) values ($1,$2,'case',$3)`, [id, org, label]);
}

export async function advanceCase(userId: string, id: string, status: CaseStatus): Promise<void> {
  await upsertCase(userId, id, `status = $3`, [status], CASE_EVENT_LABEL[status]);
}

export async function assignCase(userId: string, id: string, who: string | null): Promise<void> {
  // Assigning a still-open case implies acknowledgement.
  const label = who ? `Asignado a ${who}` : "Sin asignar";
  await upsertCase(userId, id, `assignee = $3::text, status = case when cases.status = 'open' and $3::text is not null then 'acknowledged' else cases.status end`, [who], label);
}

export async function markBred(userId: string, id: string): Promise<void> {
  const org = await animalOrg(userId, id);
  if (!org) return;
  const pool = getPool();
  await pool.query(`insert into breeding_events (animal_id, org_id, kind) values ($1,$2,'bred')`, [id, org]);
  await pool.query(`insert into animal_events (animal_id, org_id, kind, title) values ($1,$2,'bred','Inseminada (registrada)')`, [id, org]);
}
