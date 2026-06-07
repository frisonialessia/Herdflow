"use server";

import { redirect } from "next/navigation";
import { getPool } from "@/server/db";
import { setSession, clearSession } from "@/lib/auth/session";

// Passwordless login (for now). Any valid email gets in: an existing user logs
// straight in; a new email is auto-provisioned and attached to the default farm
// so they immediately see data. Production: swap for real auth (Supabase magic
// link) + one org per signup — the rest of the app only depends on the session.
export async function login(formData: FormData) {
  if (!process.env.DATABASE_URL) redirect("/dashboard"); // demo mode: any email → synthetic herd

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/login?error=invalid");

  const pool = getPool();
  const found = await pool.query<{ id: string }>(`select id from users where lower(email) = $1`, [email]);

  let userId: string;
  if (found.rowCount && found.rows[0]) {
    userId = found.rows[0].id;
  } else {
    const created = await pool.query<{ id: string }>(`insert into users (email) values ($1) returning id`, [email]);
    userId = created.rows[0].id;
    const org = await pool.query<{ id: string }>(`select id from organizations order by created_at asc limit 1`);
    if (org.rowCount && org.rows[0]) {
      await pool.query(
        `insert into memberships (user_id, org_id, role) values ($1, $2, 'owner') on conflict do nothing`,
        [userId, org.rows[0].id]
      );
    }
  }

  setSession(userId);
  redirect("/dashboard");
}

export async function signOut() {
  clearSession();
  redirect(process.env.DATABASE_URL ? "/login" : "/");
}
