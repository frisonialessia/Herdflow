// Seed a local Postgres with a realistic herd from the synthetic generator —
// so you can build the whole backend without any real sensors. Each run creates
// one farm org + site + zone + device + 40 animals and their reading history.
//
//   npm run db:seed
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomUUID, createHash } from "node:crypto";
import { getPool } from "./db";
import { generateHerd } from "../lib/mock_data_generator";
import type { MetricKey } from "../lib/types";

const METRICS: MetricKey[] = [
  "temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate",
];

async function main() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");

    const orgId = randomUUID();
    await client.query(
      `insert into organizations (id, type, name, country) values ($1,'farm','Green Valley Farm','MX')`,
      [orgId]
    );

    await client.query(
      `insert into users (id, email, full_name) values ($1,'demo@herdflow.app','Demo Owner')
       on conflict (email) do nothing`,
      [randomUUID()]
    );
    const u = await client.query<{ id: string }>(`select id from users where email='demo@herdflow.app'`);
    await client.query(
      `insert into memberships (user_id, org_id, role) values ($1,$2,'owner') on conflict do nothing`,
      [u.rows[0].id, orgId]
    );

    const siteId = randomUUID();
    await client.query(`insert into sites (id, org_id, name) values ($1,$2,'Pasture A')`, [siteId, orgId]);
    const zoneId = randomUUID();
    await client.query(`insert into zones (id, site_id, name) values ($1,$2,'Lot 1')`, [zoneId, siteId]);

    const apiKey = "dev_" + randomUUID().replace(/-/g, "");
    const apiKeyHash = createHash("sha256").update(apiKey).digest("hex");
    await client.query(
      `insert into devices (id, org_id, site_id, vendor, api_key_hash) values ($1,$2,$3,'seed',$4)`,
      [randomUUID(), orgId, siteId, apiKeyHash]
    );

    const herd = generateHerd(40);
    let readingCount = 0;
    for (const a of herd) {
      const animalId = randomUUID();
      const p = a.profile!;
      await client.query(
        `insert into animals (id, org_id, site_id, zone_id, tag_id, species, name,
                              sex, breed, birth_date, origin, location, diet, feeding_times, water_l, medical_history)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [animalId, orgId, siteId, zoneId, a.tag_id, a.species, a.name,
         p.sex, p.breed, p.birthDate, p.origin, p.location, p.diet, p.feedingTimes, p.waterIntakeL, p.medicalHistory]
      );

      // Vaccination card + the enrollment event (history starts at platform entry).
      for (const v of p.vaccines) {
        await client.query(
          `insert into vaccinations (animal_id, org_id, name, applied_on) values ($1,$2,$3,$4)`,
          [animalId, orgId, v.name, v.date || null]
        );
      }
      await client.query(
        `insert into animal_events (animal_id, org_id, at, kind, title, detail)
         values ($1,$2,$3,'enrolled','Alta en la plataforma','Monitoreo iniciado')`,
        [animalId, orgId, a.series[0].recorded_at]
      );

      const ts: string[] = [];
      const ms: string[] = [];
      const vs: number[] = [];
      for (const p of a.series) {
        for (const m of METRICS) {
          ts.push(p.recorded_at);
          ms.push(m);
          vs.push(p[m] as number);
        }
      }
      await client.query(
        `insert into readings (animal_id, org_id, recorded_at, metric, value)
         select $1, $2, t.recorded_at, t.metric, t.value
         from unnest($3::timestamptz[], $4::text[], $5::float8[]) as t(recorded_at, metric, value)`,
        [animalId, orgId, ts, ms, vs]
      );
      readingCount += vs.length;
    }

    await client.query("commit");
    console.log(`✓ Seeded farm org ${orgId}`);
    console.log(`  ${herd.length} animals · ${readingCount} readings · 1 site · 1 zone · 1 device`);
    console.log(`  Device API key (use in POST /api/v1/readings): ${apiKey}`);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
