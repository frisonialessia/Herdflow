// Server-only: a tenant's plan and its live usage. The plan comes from the
// org's subscriptions row (default free when there's none yet); usage is COUNTED
// LIVE from the animals table — the source of truth — so the limit is enforced
// correctly even if the denormalised subscriptions.active_animals mirror drifts.
// When Stripe lands it only sets subscriptions.plan / stripe_customer_id.
//
// Do NOT import from a client component (uses `pg`).
import { getPool } from "@/server/db";
import { planOf, remainingOf, type Plan } from "@/lib/plans";

export interface Entitlements {
  plan: Plan;
  used: number; // active animals in the org
  limit: number | null; // plan cap (null = unlimited)
  remaining: number | null; // headroom (null = unlimited)
  atLimit: boolean;
}

/** The user's primary org (oldest membership). */
async function primaryOrgId(userId: string): Promise<string | null> {
  const r = await getPool().query<{ org_id: string }>(
    `select org_id from memberships where user_id = $1 order by created_at asc limit 1`,
    [userId]
  );
  return r.rows[0]?.org_id ?? null;
}

async function planForOrg(orgId: string): Promise<Plan> {
  const r = await getPool().query<{ plan: string | null }>(`select plan from subscriptions where org_id = $1`, [orgId]);
  return planOf(r.rows[0]?.plan);
}

async function countActiveAnimals(orgId: string): Promise<number> {
  const r = await getPool().query<{ n: string }>(`select count(*) n from animals where org_id = $1 and status = 'active'`, [orgId]);
  return Number(r.rows[0].n);
}

export async function entitlementsForOrg(orgId: string): Promise<Entitlements> {
  const [plan, used] = await Promise.all([planForOrg(orgId), countActiveAnimals(orgId)]);
  const limit = plan.animalLimit;
  return { plan, used, limit, remaining: remainingOf(limit, used), atLimit: limit !== null && used >= limit };
}

export async function entitlementsForUser(userId: string): Promise<Entitlements | null> {
  const orgId = await primaryOrgId(userId);
  return orgId ? entitlementsForOrg(orgId) : null;
}

/** Keep the denormalised subscriptions.active_animals mirror in step with the
 * live count (best-effort; for billing/display). Creates a free row if missing. */
export async function syncActiveAnimals(orgId: string): Promise<number> {
  const n = await countActiveAnimals(orgId);
  await getPool().query(
    `insert into subscriptions (org_id, plan, active_animals) values ($1,'free',$2)
       on conflict (org_id) do update set active_animals = excluded.active_animals, updated_at = now()`,
    [orgId, n]
  );
  return n;
}
