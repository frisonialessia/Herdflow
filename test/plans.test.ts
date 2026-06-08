import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, DEFAULT_PLAN, planOf, isPlanId, withinLimit, remainingOf, usageLabel } from "@/lib/plans";

describe("plans catalog", () => {
  it("each entry's id matches its key and the order is complete & unique", () => {
    for (const [key, plan] of Object.entries(PLANS)) expect(plan.id).toBe(key);
    expect(PLAN_ORDER).toEqual(["free", "pro", "business"]);
    expect(new Set(PLAN_ORDER).size).toBe(PLAN_ORDER.length);
  });

  it("limits climb, then go unlimited", () => {
    expect(PLANS.free.animalLimit).toBe(50);
    expect(PLANS.pro.animalLimit).toBe(500);
    expect(PLANS.business.animalLimit).toBeNull();
    expect(PLANS.free.animalLimit!).toBeLessThan(PLANS.pro.animalLimit!);
  });

  it("every plan has a Spanish name and blurb", () => {
    for (const id of PLAN_ORDER) {
      expect(PLANS[id].name).toBeTruthy();
      expect(PLANS[id].blurb).toBeTruthy();
    }
  });
});

describe("planOf / isPlanId", () => {
  it("resolves a known id", () => {
    expect(planOf("pro").id).toBe("pro");
  });

  it("defaults unknown/missing values to free", () => {
    expect(planOf(null).id).toBe(DEFAULT_PLAN);
    expect(planOf(undefined).id).toBe("free");
    expect(planOf("enterprise").id).toBe("free");
  });

  it("guards plan ids", () => {
    expect(isPlanId("free")).toBe(true);
    expect(isPlanId("nope")).toBe(false);
    expect(isPlanId(null)).toBe(false);
  });
});

describe("withinLimit", () => {
  it("treats unlimited (null) as always fitting", () => {
    expect(withinLimit(null, 10_000)).toBe(true);
    expect(withinLimit(null, 0, 1000)).toBe(true);
  });

  it("respects the cap at the boundary", () => {
    expect(withinLimit(50, 49)).toBe(true);
    expect(withinLimit(50, 50)).toBe(false);
    expect(withinLimit(50, 49, 2)).toBe(false);
    expect(withinLimit(50, 0, 50)).toBe(true);
    expect(withinLimit(50, 0, 51)).toBe(false);
  });
});

describe("remainingOf / usageLabel", () => {
  it("computes headroom — clamped, and unlimited-aware", () => {
    expect(remainingOf(50, 10)).toBe(40);
    expect(remainingOf(50, 60)).toBe(0);
    expect(remainingOf(null, 999)).toBeNull();
  });

  it("formats usage for the UI", () => {
    expect(usageLabel(50, 12)).toBe("12 / 50");
    expect(usageLabel(null, 12)).toBe("12 / ∞");
  });
});
