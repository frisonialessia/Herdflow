"use server";

import { redirect } from "next/navigation";
import { findOrCreateUser } from "@/lib/db/onboarding";
import { setSession, clearSession } from "@/lib/auth/session";

// Passwordless login (for now). Any valid email gets in: an existing user logs
// straight in; a new email is provisioned with its OWN organization (farm + site)
// and becomes its owner — proper tenant isolation. Production: swap for real auth
// (Supabase magic link) — the rest of the app only depends on the session.
export async function login(formData: FormData) {
  if (!process.env.DATABASE_URL) redirect("/dashboard"); // demo mode: any email → synthetic herd

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/login?error=invalid");

  const userId = await findOrCreateUser(email);
  setSession(userId);
  redirect("/dashboard");
}

export async function signOut() {
  clearSession();
  redirect(process.env.DATABASE_URL ? "/login" : "/");
}
