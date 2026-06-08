"use client";

// The tenant's plan, provided by the dashboard layout (read server-side from the
// subscriptions row). Live usage is derived where needed from the herd itself
// (herd.length === active animals in real mode), so the displayed headroom never
// goes stale as animals are added. Demo / fallback = the unlimited plan, so the
// public demo is never capped. The server independently re-enforces the limit.

import { createContext, useContext } from "react";
import { PLANS, type Plan } from "@/lib/plans";

const Ctx = createContext<{ plan: Plan } | null>(null);

export function EntitlementsProvider({ children, plan = PLANS.business }: { children: React.ReactNode; plan?: Plan }) {
  return <Ctx.Provider value={{ plan }}>{children}</Ctx.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEntitlements must be used within <EntitlementsProvider>");
  return ctx;
}
