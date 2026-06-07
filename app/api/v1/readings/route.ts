// Ingestion API — devices push telemetry here.
//   POST /api/v1/readings
//   { "api_key": "...", "readings": [{ "tag_id","recorded_at","metric","value" }, ...] }
//
// Per-site API key (hashed), Zod-validated, tenant-scoped insert. This is the
// generic, hardware-agnostic entry point: every vendor adapter normalises to it.
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getPool } from "@/server/db";

export const dynamic = "force-dynamic";

const Body = z.object({
  api_key: z.string().min(8),
  readings: z
    .array(
      z.object({
        tag_id: z.string().min(1),
        recorded_at: z.string().datetime(),
        metric: z.enum([
          "temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate",
        ]),
        value: z.number().finite(),
      })
    )
    .min(1)
    .max(1000),
});

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "ingestion not configured (set DATABASE_URL)" }, { status: 503 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid payload", detail: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }

  const pool = getPool();
  const hash = createHash("sha256").update(body.api_key).digest("hex");
  const dev = await pool.query<{ org_id: string; site_id: string }>(
    `select org_id, site_id from devices where api_key_hash = $1`,
    [hash]
  );
  if (dev.rowCount === 0) {
    return NextResponse.json({ error: "unauthorized device" }, { status: 401 });
  }
  const { org_id, site_id } = dev.rows[0];

  // resolve tag_id → animal_id within this device's site
  const tags = Array.from(new Set(body.readings.map((r) => r.tag_id)));
  const animals = await pool.query<{ id: string; tag_id: string }>(
    `select id, tag_id from animals where site_id = $1 and tag_id = any($2::text[])`,
    [site_id, tags]
  );
  const tagToId = new Map(animals.rows.map((a) => [a.tag_id, a.id]));

  const ids: string[] = [];
  const ts: string[] = [];
  const ms: string[] = [];
  const vs: number[] = [];
  let skipped = 0;
  for (const r of body.readings) {
    const animalId = tagToId.get(r.tag_id);
    if (!animalId) { skipped++; continue; }
    ids.push(animalId); ts.push(r.recorded_at); ms.push(r.metric); vs.push(r.value);
  }

  if (ids.length > 0) {
    await pool.query(
      `insert into readings (animal_id, org_id, recorded_at, metric, value)
       select t.animal_id, $1, t.recorded_at, t.metric, t.value
       from unnest($2::uuid[], $3::timestamptz[], $4::text[], $5::float8[])
            as t(animal_id, recorded_at, metric, value)`,
      [org_id, ids, ts, ms, vs]
    );
  }
  await pool.query(`update devices set last_seen = now() where api_key_hash = $1`, [hash]);

  return NextResponse.json({ accepted: ids.length, skipped_unknown_tag: skipped });
}
