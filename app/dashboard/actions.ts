"use server";

// Client-callable persistence for the operational state. The authorization
// boundary: every write resolves the session user, reads their role from the DB,
// and checks the required capability server-side — the client UI gating is only
// cosmetic. No-ops in demo mode (no DATABASE_URL) so the synthetic experience is
// untouched.

import { getSessionUserId } from "@/lib/auth/session";
import { getUserRole } from "@/lib/db/access";
import { can, type Capability } from "@/lib/roles";
import * as db from "@/lib/db/mutations";
import { seedSampleHerd } from "@/lib/db/onboarding";
import type { Animal, CaseStatus } from "@/lib/types";

/** Resolve the session user and verify they hold `cap`; null = denied/demo. */
async function authed(cap: Capability): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;
  const u = getSessionUserId();
  if (!u) return null;
  const role = await getUserRole(u);
  return role && can(role, cap) ? u : null;
}

export async function createAnimalAction(input: db.AnimalInput): Promise<Animal | null> {
  const u = await authed("addAnimal");
  return u ? db.createAnimal(u, input) : null;
}

export async function updateAnimalAction(id: string, patch: db.AnimalPatch): Promise<void> {
  const u = await authed("editAnimal");
  if (u) await db.updateAnimal(u, id, patch);
}

export async function removeAnimalAction(id: string): Promise<void> {
  const u = await authed("deleteAnimal");
  if (u) await db.removeAnimal(u, id);
}

export async function advanceCaseAction(id: string, status: CaseStatus): Promise<void> {
  const u = await authed("manageCases");
  if (u) await db.advanceCase(u, id, status);
}

export async function assignCaseAction(id: string, who: string | null): Promise<void> {
  const u = await authed("manageCases");
  if (u) await db.assignCase(u, id, who);
}

export async function markBredAction(id: string): Promise<void> {
  const u = await authed("manageBreeding");
  if (u) await db.markBred(u, id);
}

/** Bootstrap a fresh tenant with a sample herd. Returns the count created. */
export async function seedSampleHerdAction(): Promise<number> {
  const u = await authed("addAnimal");
  return u ? seedSampleHerd(u) : 0;
}
