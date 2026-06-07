import { describe, it, expect } from "vitest";
import { thi, classifyThi, summarizeHeat, heatRiskFor } from "@/lib/heat";
import { generateHerd } from "@/lib/mock_data_generator";
import { animalWith } from "./helpers";

describe("thi (Temperature-Humidity Index)", () => {
  it("matches the NRC formula", () => {
    // (1.8*30+32) - (0.55 - 0.0055*60)*(1.8*30 - 26) = 86 - 0.22*28 = 79.84
    expect(thi(30, 60)).toBeCloseTo(79.84, 2);
  });
});

describe("classifyThi bands", () => {
  it("places values in the right action band at the boundaries", () => {
    expect(classifyThi(71).key).toBe("none");
    expect(classifyThi(72).key).toBe("mild");
    expect(classifyThi(78).key).toBe("mild");
    expect(classifyThi(79).key).toBe("danger");
    expect(classifyThi(88).key).toBe("danger");
    expect(classifyThi(89).key).toBe("emergency");
  });
});

describe("heatRiskFor", () => {
  it("loads heat-sensitive species harder than hardy ones", () => {
    const dairy = animalWith({ id: "d", species: "dairy" });
    const horse = animalWith({ id: "h", species: "horse" });
    expect(heatRiskFor(dairy, 85).score).toBeGreaterThan(heatRiskFor(horse, 85).score);
  });
});

describe("summarizeHeat", () => {
  const herd = generateHerd(20, 99);

  it("peaks at 15:00 and is deterministic for a given time", () => {
    const t = new Date(2026, 5, 15, 9, 0, 0);
    const a = summarizeHeat(herd, t);
    const b = summarizeHeat(herd, t);
    expect(a.peak.hour).toBe(15);
    expect(a.risks.map((r) => r.heat.score)).toEqual(b.risks.map((r) => r.heat.score));
  });

  it("the tuned climate reaches a dangerous afternoon peak", () => {
    const t = new Date(2026, 5, 15, 9, 0, 0);
    const s = summarizeHeat(herd, t);
    expect(["danger", "emergency"]).toContain(s.peakBand.key);
  });

  it("counts down to the peak in the morning and reports past-peak in the evening", () => {
    const morning = summarizeHeat(herd, new Date(2026, 5, 15, 9, 0, 0));
    expect(morning.pastPeak).toBe(false);
    expect(morning.hoursToPeak).toBeGreaterThan(0);

    const evening = summarizeHeat(herd, new Date(2026, 5, 15, 20, 0, 0));
    expect(evening.pastPeak).toBe(true);
    expect(evening.hoursToPeak).toBe(0);
  });
});
