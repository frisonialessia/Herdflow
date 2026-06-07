"use server";

// Client-callable persistence for the operational state. No-ops in demo mode
// (no DATABASE_URL) so the synthetic experience is untouched; in real mode each
// call writes to Postgres, org-scoped to the session user.

import { getSessionUserId } from "@/lib/auth/session";
import * as db from "@/lib/db/mutations";
import type { Animal, CaseStatus } from "@/lib/types";

const uid = () => (process.env.DATABASE_URL ? getSessionUserId() : null);

export async function createAnimalAction(input: db.AnimalInput): Promise<Animal | null> {
  const u = uid();
  return u ? db.createAnimal(u, input) : null;
}

export async function updateAnimalAction(id: string, patch: db.AnimalPatch): Promise<void> {
  const u = uid();
  if (u) await db.updateAnimal(u, id, patch);
}

export async function removeAnimalAction(id: string): Promise<void> {
  const u = uid();
  if (u) await db.removeAnimal(u, id);
}

export async function advanceCaseAction(id: string, status: CaseStatus): Promise<void> {
  const u = uid();
  if (u) await db.advanceCase(u, id, status);
}

export async function assignCaseAction(id: string, who: string | null): Promise<void> {
  const u = uid();
  if (u) await db.assignCase(u, id, who);
}

export async function markBredAction(id: string): Promise<void> {
  const u = uid();
  if (u) await db.markBred(u, id);
}
