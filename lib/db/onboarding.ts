// Tenant onboarding (server-only). A brand-new email gets its OWN organization
// (a farm) + site + zone and becomes its owner — proper tenant isolation. An
// existing email just logs in. seedSampleHerd lets a fresh, empty tenant load a
// starter herd so the first screen isn't a dead end.
import { getPool } from "@/server/db";
import { generateHerd } from "@/lib/mock_data_generator";
import type { MetricKey } from "@/lib/types";

const METRICS: MetricKey[] = ["temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate"];

/** Existing user → their id; new email → provision their own org/site and return id. */
export async function findOrCreateUser(email: string): Promise<string> {
  const pool = getPool();
  const existing = await pool.query<{ id: string }>(`select id from users where lower(email) = $1`, [email]);
  if (existing.rows[0]) return existing.rows[0].id;

  const local = email.split("@")[0] || "rancho";
  const name = `Rancho de ${local.charAt(0).toUpperCase()}${local.slice(1)}`;

  const client = await pool.connect();
  try {
    await client.query("begin");
    const u = await client.query<{ id: string }>(`insert into users (email) values ($1) returning id`, [email]);
    const userId = u.rows[0].id;
    const org = await client.query<{ id: string }>(`insert into organizations (type, name, country) values ('farm',$1,'MX') returning id`, [name]);
    const orgId = org.rows[0].id;
    await client.query(`insert into memberships (user_id, org_id, role) values ($1,$2,'owner')`, [userId, orgId]);
    const site = await client.query<{ id: string }>(`insert into sites (org_id, name) values ($1,'Sitio principal') returning id`, [orgId]);
    await client.query(`insert into zones (site_id, name) values ($1,'Lote 1')`, [site.rows[0].id]);
    await client.query("commit");
    return userId;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

/** Populate the user's (empty) org with a synthetic starter herd. No-op if it
 * already has animals. Returns the number created. */
export async function seedSampleHerd(userId: string): Promise<number> {
  const pool = getPool();
  const loc = await pool.query<{ org_id: string; site_id: string; zone_id: string | null }>(
    `select m.org_id, s.id as site_id, z.id as zone_id
       from memberships m join sites s on s.org_id = m.org_id
       left join zones z on z.site_id = s.id
      where m.user_id = $1 order by m.created_at asc, s.created_at asc limit 1`,
    [userId]
  );
  if (!loc.rows[0]) return 0;
  const { org_id, site_id, zone_id } = loc.rows[0];

  const cnt = await pool.query<{ n: string }>(`select count(*) n from animals where org_id = $1`, [org_id]);
  if (Number(cnt.rows[0].n) > 0) return 0;

  const herd = generateHerd(40);
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const a of herd) {
      const p = a.profile!;
      const ins = await client.query<{ id: string }>(
        `insert into animals (org_id, site_id, zone_id, tag_id, species, name,
                              sex, breed, birth_date, origin, location, diet, feeding_times, water_l, medical_history)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning id`,
        [org_id, site_id, zone_id, a.tag_id, a.species, a.name,
         p.sex, p.breed, p.birthDate || null, p.origin, p.location, p.diet, p.feedingTimes, p.waterIntakeL, p.medicalHistory]
      );
      const id = ins.rows[0].id;
      const ts: string[] = [], ms: string[] = [], vs: number[] = [];
      for (const pt of a.series) for (const m of METRICS) { ts.push(pt.recorded_at); ms.push(m); vs.push(pt[m] as number); }
      await client.query(
        `insert into readings (animal_id, org_id, recorded_at, metric, value)
         select $1,$2,t.recorded_at,t.metric,t.value from unnest($3::timestamptz[],$4::text[],$5::float8[]) as t(recorded_at,metric,value)`,
        [id, org_id, ts, ms, vs]
      );
      for (const v of p.vaccines) await client.query(`insert into vaccinations (animal_id, org_id, name, applied_on) values ($1,$2,$3,$4)`, [id, org_id, v.name, v.date || null]);
      await client.query(
        `insert into animal_events (animal_id, org_id, at, kind, title, detail) values ($1,$2,$3,'enrolled','Alta en la plataforma','Monitoreo iniciado')`,
        [id, org_id, a.series[0].recorded_at]
      );
    }
    await client.query("commit");
    return herd.length;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
