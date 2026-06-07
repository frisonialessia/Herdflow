// Alert dispatch worker (the outbox drainer). Picks up `pending` alerts that the
// detection worker enqueued, resolves recipients (the org's members), sends via
// the env-gated adapter (dry-run when no provider key — see server/notify.ts),
// and records the outcome. Run it on a schedule, right after detection:
//
//   npm run db:detect && npm run db:alerts
import { config } from "dotenv";
config({ path: ".env.local" });

import { getPool } from "./db";
import { dispatch } from "./notify";

type PendingAlert = {
  id: string;
  org_id: string;
  animal_id: string;
  tag_id: string;
  name: string | null;
  metric: string;
  condition: string | null;
  z_score: string;
  observed: string | null;
};

async function main() {
  const pool = getPool();

  const pending = await pool.query<PendingAlert>(
    `select al.id, al.org_id, al.animal_id,
            a.tag_id, a.name,
            an.metric, an.condition, an.z_score, an.observed
       from alerts al
       join animals  a  on a.id  = al.animal_id
       join anomalies an on an.id = al.anomaly_id
      where al.status = 'pending'
      order by al.created_at asc`
  );

  let sent = 0;
  let failed = 0;
  for (const row of pending.rows) {
    const rec = await pool.query<{ email: string }>(
      `select u.email
         from memberships m
         join users u on u.id = m.user_id
        where m.org_id = $1`,
      [row.org_id]
    );
    const recipients = rec.rows.map((r) => r.email);

    const result = await dispatch({
      orgId: row.org_id,
      animalLabel: row.name ?? row.tag_id,
      metric: row.metric,
      condition: row.condition,
      zScore: Number(row.z_score),
      observed: row.observed == null ? null : Number(row.observed),
      recipients,
    });

    await pool.query(
      `update alerts
          set status = $1, provider = $2, destination = $3, error = $4, sent_at = now()
        where id = $5`,
      [result.ok ? "sent" : "failed", result.provider, result.destination, result.error ?? null, row.id]
    );
    if (result.ok) sent++;
    else failed++;
  }

  const mode = process.env.RESEND_API_KEY ? "resend" : "console (dry-run, $0)";
  console.log(`✓ Alerts dispatched · ${sent} sent · ${failed} failed · provider=${mode}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
