"use server";

import { redirect } from "next/navigation";
import { getPool } from "@/server/db";
import { setSession, clearSession } from "@/lib/auth/session";

// Dev passwordless login: match an email to a seeded user and start a session.
// Production: add a password / magic-link (the session layer stays the same).
export async function login(formData: FormData) {
  if (!process.env.DATABASE_URL) redirect("/dashboard");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/login?error=notfound");

  const pool = getPool();
  const res = await pool.query<{ id: string }>(`select id from users where lower(email) = $1`, [email]);
  if (res.rowCount === 0) redirect("/login?error=notfound");

  setSession(res.rows[0].id);
  redirect("/dashboard");
}

export async function signOut() {
  clearSession();
  redirect(process.env.DATABASE_URL ? "/login" : "/");
}
