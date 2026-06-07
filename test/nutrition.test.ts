import { describe, it, expect } from "vitest";
import { nutritionOf, summarizeNutrition } from "@/lib/nutrition";
import { generateHerd } from "@/lib/mock_data_generator";
import { animalWith } from "./helpers";
import type { MetricPoint } from "@/lib/types";

const point = (over: Partial<MetricPoint>): MetricPoint => ({
  recorded_at: "2026-01-01T00:00:00.000Z",
  temperature_c: 38.5,
  activity_index: 60,
  rumination_min: 480,
  intake_kg: 11,
  heart_rate: 65,
  respiration_rate: 28,
  ...over,
});

describe("nutritionOf", () => {
  it("knows which species ruminate", () => {
    expect(nutritionOf(animalWith({ species: "dairy" })).ruminant).toBe(true);
    const horse = nutritionOf(animalWith({ species: "horse" }));
    expect(horse.ruminant).toBe(false);
    expect(horse.rumPct).toBeNull();
  });

  it("flags a big intake drop as off-feed", () => {
    const a = animalWith({
      species: "dairy",
      baseline: { temperature_c: 38.5, activity_index: 60, rumination_min: 480, intake_kg: 11, heart_rate: 65, respiration_rate: 28 },
      latest: point({ intake_kg: 6 }), // ~55% of baseline
    });
    expect(nutritionOf(a).status).toBe("off_feed");
  });

  it("keeps BCS within the modelled herd range and consistent with its band", () => {
    for (const a of generateHerd(20, 99)) {
      const n = nutritionOf(a);
      expect(n.bcs).toBeGreaterThanOrEqual(2.4);
      expect(n.bcs).toBeLessThanOrEqual(3.8);
      const band = n.bcs < 2.75 ? "thin" : n.bcs > 3.5 ? "over" : "ideal";
      expect(n.bcsBand).toBe(band);
    }
  });
});

describe("summarizeNutrition", () => {
  it("BCS buckets sum to the herd and the on-feed index is a %", () => {
    const herd = generateHerd(40, 99);
    const s = summarizeNutrition(herd);
    expect(s.total).toBe(herd.length);
    expect(s.bcs.thin + s.bcs.ideal + s.bcs.over).toBe(herd.length);
    expect(s.index).toBeGreaterThanOrEqual(0);
    expect(s.index).toBeLessThanOrEqual(100);
  });

  it("an empty herd is a clean slate", () => {
    const s = summarizeNutrition([]);
    expect(s.index).toBe(100);
    expect(s.offFeed).toHaveLength(0);
  });
});
