import { describe, it, expect } from "vitest";
import { breedInfo, dailyFeedCost, BREED_INFO, FEED_PRICE_PER_KG } from "@/lib/breeds";
import type { Species } from "@/lib/types";

const SPECIES: Species[] = ["dairy", "beef", "sheep", "horse", "poultry"];

describe("breedInfo", () => {
  it("returns breed-specific data for a known breed", () => {
    const holstein = breedInfo("dairy", "Holstein");
    const jersey = breedInfo("dairy", "Jersey");
    expect(holstein.feedKgDay).toBeGreaterThan(jersey.feedKgDay); // Holstein eats more
    expect(holstein.weightKg).toBeGreaterThan(jersey.weightKg);
    expect(holstein.predispositions.length).toBeGreaterThan(0);
  });

  it("falls back to a sensible default for unknown/missing breeds", () => {
    const def = breedInfo("beef", "Raza Inexistente");
    const none = breedInfo("beef", undefined);
    expect(def).toEqual(none);
    expect(def.feedKgDay).toBeGreaterThan(0);
    expect(def.purpose).toBeTruthy();
  });

  it("every catalog breed is well-formed", () => {
    for (const sp of SPECIES) {
      for (const [name, info] of Object.entries(BREED_INFO[sp])) {
        expect(name.length).toBeGreaterThan(0);
        expect(info.weightKg).toBeGreaterThan(0);
        expect(info.feedKgDay).toBeGreaterThan(0);
        expect(info.care).toBeTruthy();
      }
    }
  });
});

describe("dailyFeedCost", () => {
  it("is feed requirement times the species feed price, rounded", () => {
    const cost = dailyFeedCost("dairy", "Holstein");
    expect(cost).toBe(Math.round(breedInfo("dairy", "Holstein").feedKgDay * FEED_PRICE_PER_KG.dairy));
    expect(cost).toBeGreaterThan(0);
  });

  it("a bigger eater costs more to feed", () => {
    expect(dailyFeedCost("dairy", "Holstein")).toBeGreaterThan(dailyFeedCost("dairy", "Jersey"));
  });
});
