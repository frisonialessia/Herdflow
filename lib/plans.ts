// Plans & entitlements catalog. A plan caps what a tenant can do; today that's
// just an active-animal limit, enforced on the server. This is the structure
// billing plugs into: when Stripe lands, a webhook sets subscriptions.plan (and
// stripe_customer_id) and nothing here changes. Plan ids stay English (stored in
// subscriptions.plan); the labels are Spanish for the UI.

export type PlanId = "free" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string; // Spanish UI label
  animalLimit: number | null; // max active animals; null = unlimited
  priceMxn: number; // monthly, for display (0 = free / contact sales)
  blurb: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Gratis", animalLimit: 50, priceMxn: 0, blurb: "Para empezar — hasta 50 animales monitoreados." },
  pro: { id: "pro", name: "Profesional", animalLimit: 500, priceMxn: 1499, blurb: "Para ranchos en crecimiento — hasta 500 animales." },
  business: { id: "business", name: "Empresa", animalLimit: null, priceMxn: 0, blurb: "Hatos grandes y cooperativas — animales ilimitados." },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];
export const DEFAULT_PLAN: PlanId = "free";

export function isPlanId(v: string | null | undefined): v is PlanId {
  return v === "free" || v === "pro" || v === "business";
}

/** The plan for a stored id, defaulting to free for unknown/missing values. */
export function planOf(id: string | null | undefined): Plan {
  return isPlanId(id) ? PLANS[id] : PLANS[DEFAULT_PLAN];
}

/** Remaining animal headroom (null = unlimited). Never negative. */
export function remainingOf(limit: number | null, used: number): number | null {
  return limit === null ? null : Math.max(0, limit - used);
}

/** Can the org hold `count` more animals under `limit` given current `used`? */
export function withinLimit(limit: number | null, used: number, count = 1): boolean {
  return limit === null || used + count <= limit;
}

/** "12 / 50" or "12 / ∞" for display. */
export function usageLabel(limit: number | null, used: number): string {
  return `${used} / ${limit === null ? "∞" : limit}`;
}
