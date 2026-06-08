// Postgres integration tests — they codify the data-layer behaviour we used to
// verify by hand: tenant provisioning, the animal write/read round-trip, tenant
// isolation, the operational state (cases / breeding / history) and sample-herd
// seeding. They run only when DATABASE_URL points at a (local) Postgres with the
// schema applied; otherwise the whole block is skipped, so `npm test` is green
// anywhere. Each run uses unique emails and cleans up after itself.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getPool } from "@/server/db";
import { findOrCreateUser, seedSampleHerd } from "@/lib/db/onboarding";
import { getUserRole } from "@/lib/db/access";
import { createAnimal, updateAnimal, removeAnimal, advanceCase, assignCase, markBred } from "@/lib/db/mutations";
import { loadHerd, loadOperationalState } from "@/lib/db/herd";
import { entitlementsForUser } from "@/lib/db/entitlements";

const HAS_DB = !!process.env.DATABASE_URL;
const stamp = Date.now();

describe.skipIf(!HAS_DB)("db integration", () => {
  let userA: string; // primary tenant
  let userB: string; // a second, isolated tenant
  let userC: string; // a fresh tenant used for sample-herd seeding
  let userD: string; // a fresh tenant used for plan/limit (entitlements) tests
  const orgIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(async () => {
    userA = await findOrCreateUser(`test-a-${stamp}@herdflow.test`);
    userB = await findOrCreateUser(`test-b-${stamp}@herdflow.test`);
    userC = await findOrCreateUser(`test-c-${stamp}@herdflow.test`);
    userD = await findOrCreateUser(`test-d-${stamp}@herdflow.test`);
    userIds.push(userA, userB, userC, userD);

    // Remember each tenant's org so we can tear it all down afterwards.
    const pool = getPool();
    const rows = await pool.query<{ org_id: string }>(`select org_id from memberships where user_id = any($1::uuid[])`, [userIds]);
    for (const r of rows.rows) orgIds.push(r.org_id);
  });

  afterAll(async () => {
    const pool = getPool();
    try {
      if (orgIds.length) await pool.query(`delete from organizations where id = any($1::uuid[])`, [orgIds]);
      if (userIds.length) await pool.query(`delete from users where id = any($1::uuid[])`, [userIds]);
    } finally {
      await pool.end();
    }
  });

  it("provisions a brand-new email as the owner of its own farm", async () => {
    expect(await getUserRole(userA)).toBe("owner");

    // Re-login with the same email is idempotent — same user, no second org.
    const again = await findOrCreateUser(`test-a-${stamp}@herdflow.test`);
    expect(again).toBe(userA);

    const pool = getPool();
    const org = await pool.query<{ name: string }>(
      `select o.name from organizations o join memberships m on m.org_id = o.id where m.user_id = $1`,
      [userA]
    );
    expect(org.rows[0].name).toMatch(/^Rancho de /);
  });

  it("a fresh tenant starts with an empty herd", async () => {
    expect(await loadHerd(userA)).toHaveLength(0);
  });

  it("createAnimal persists and loadHerd reads it back", async () => {
    const created = await createAnimal(userA, { name: "Lola", species: "dairy", tag_id: "TST-1" });
    expect(created).not.toBeNull();

    const herd = await loadHerd(userA);
    const found = herd.find((a) => a.id === created!.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Lola");
    expect(found!.species).toBe("dairy");
    expect(found!.series.length).toBeGreaterThan(3);
  });

  it("isolates tenants: B cannot see A's animals", async () => {
    const herdB = await loadHerd(userB);
    expect(herdB).toHaveLength(0);
  });

  it("rejects cross-tenant writes at the data layer", async () => {
    const [a] = await loadHerd(userA);
    expect(a).toBeDefined();

    // B has no claim on A's animal: both calls must be silent no-ops.
    await removeAnimal(userB, a.id);
    await updateAnimal(userB, a.id, { name: "Secuestrada" });

    const afterA = await loadHerd(userA);
    const still = afterA.find((x) => x.id === a.id);
    expect(still).toBeDefined();
    expect(still!.name).toBe("Lola");
  });

  it("lets the owner edit an animal's ficha", async () => {
    const [a] = await loadHerd(userA);
    await updateAnimal(userA, a.id, { name: "Lola II", profile: { breed: "Jersey" } });

    const [updated] = await loadHerd(userA);
    expect(updated.name).toBe("Lola II");
    expect(updated.profile?.breed).toBe("Jersey");
  });

  it("persists the operational state (case workflow, breeding, history)", async () => {
    const [a] = await loadHerd(userA);
    await advanceCase(userA, a.id, "acknowledged");
    await assignCase(userA, a.id, "Dr. Veterinaria");
    await markBred(userA, a.id);

    const ops = await loadOperationalState(userA);
    expect(ops.cases[a.id]?.status).toBe("acknowledged");
    expect(ops.cases[a.id]?.assignee).toBe("Dr. Veterinaria");
    expect(ops.bred[a.id]).toBeTruthy();
    // history accumulates: enrollment + edit + case events + breeding
    expect((ops.log[a.id] ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("prefers the worker's baselines/anomalies over a live recompute", async () => {
    const pool = getPool();
    const created = await createAnimal(userA, { name: "Centinela", species: "dairy", tag_id: "TST-AN" });
    const orgRow = await pool.query<{ org_id: string }>(`select org_id from animals where id = $1`, [created!.id]);
    const orgId = orgRow.rows[0].org_id;

    // Materialise a worker baseline mean and an OPEN critical anomaly by hand,
    // then confirm loadHerd surfaces them instead of re-scoring the series.
    await pool.query(
      `insert into baselines (animal_id, org_id, metric, mean, stddev, window_days)
       values ($1,$2,'temperature_c',39.99,0.2,14)
       on conflict (animal_id, metric) do update set mean = excluded.mean`,
      [created!.id, orgId]
    );
    await pool.query(
      `insert into anomalies (animal_id, org_id, metric, severity, z_score, baseline, observed, condition)
       values ($1,$2,'temperature_c','critical',4.2,39.99,42.5,'Fiebre')`,
      [created!.id, orgId]
    );

    const herd = await loadHerd(userA);
    const a = herd.find((x) => x.id === created!.id)!;
    expect(a.status).toBe("critical");
    expect(a.deviation.metric).toBe("temperature_c");
    expect(a.deviation.z_score).toBeCloseTo(4.2, 2);
    expect(a.deviation.observed).toBeCloseTo(42.5, 2);
    expect(a.baseline.temperature_c).toBeCloseTo(39.99, 2);
  });

  it("seeds a sample herd into an empty org exactly once", async () => {
    expect(await seedSampleHerd(userC)).toBe(40);
    expect(await loadHerd(userC)).toHaveLength(40);
    // usage is now synced and the org is still on the default free plan
    const ent = (await entitlementsForUser(userC))!;
    expect(ent.used).toBe(40);
    expect(ent.plan.id).toBe("free");
    // idempotent: the org already has animals, so a second call is a no-op
    expect(await seedSampleHerd(userC)).toBe(0);
  });

  it("a new tenant is on the free plan with full headroom", async () => {
    const ent = (await entitlementsForUser(userD))!;
    expect(ent.plan.id).toBe("free");
    expect(ent.used).toBe(0);
    expect(ent.limit).toBe(50);
    expect(ent.remaining).toBe(50);
    expect(ent.atLimit).toBe(false);
  });

  it("counts active animals and enforces the cap in createAnimal", async () => {
    const pool = getPool();
    const loc = await pool.query<{ org_id: string; site_id: string }>(
      `select m.org_id, s.id site_id from memberships m join sites s on s.org_id = m.org_id
        where m.user_id = $1 order by m.created_at asc limit 1`,
      [userD]
    );
    const { org_id, site_id } = loc.rows[0];

    // Fill the org to the free cap with bare active rows — the limit is count-
    // based, so no readings are needed and the insert is a single fast query.
    await pool.query(
      `insert into animals (org_id, site_id, tag_id, species, name, status)
       select $1,$2,'CAP-'||g,'dairy','Tope '||g,'active' from generate_series(1,50) g`,
      [org_id, site_id]
    );

    const ent = (await entitlementsForUser(userD))!;
    expect(ent.used).toBe(50);
    expect(ent.remaining).toBe(0);
    expect(ent.atLimit).toBe(true);

    // The server refuses the 51st animal.
    expect(await createAnimal(userD, { name: "Excedente", species: "dairy" })).toBeNull();
  });

  it("an upgrade lifts the cap and unblocks creation", async () => {
    const pool = getPool();
    const orgRow = await pool.query<{ org_id: string }>(`select org_id from memberships where user_id = $1`, [userD]);
    const orgId = orgRow.rows[0].org_id;
    await pool.query(
      `insert into subscriptions (org_id, plan) values ($1,'pro')
       on conflict (org_id) do update set plan = excluded.plan`,
      [orgId]
    );

    const ent = (await entitlementsForUser(userD))!;
    expect(ent.plan.id).toBe("pro");
    expect(ent.limit).toBe(500);
    expect(ent.atLimit).toBe(false);

    // The previously-refused create now succeeds.
    expect(await createAnimal(userD, { name: "Permitida", species: "dairy" })).not.toBeNull();
  });
});
