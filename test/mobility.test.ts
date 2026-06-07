import { describe, it, expect } from "vitest";
import { mobilityOf, isHooved, summarizeMobility } from "@/lib/mobility";
import { generateHerd } from "@/lib/mock_data_generator";
import { animalWith } from "./helpers";

describe("mobilityOf", () => {
  it("only scores hooved species", () => {
    expect(isHooved(animalWith({ species: "poultry" }))).toBe(false);
    expect(mobilityOf(animalWith({ species: "poultry" }))).toBeNull();
    expect(mobilityOf(animalWith({ species: "dairy" }))).not.toBeNull();
  });

  it("turns a real activity-drop flag into an acute lameness score", () => {
    const lame = animalWith({
      species: "dairy",
      status: "critical",
      deviation: { metric: "activity_index", z_score: -3.4, baseline: 60, observed: 30, severity: "critical" },
    });
    const m = mobilityOf(lame)!;
    expect(m.score).toBe(3);
    expect(m.acute).toBe(true);
    expect(m.drop).toBeCloseTo(0.5, 2);
  });
});

describe("summarizeMobility", () => {
  it("distribution sums to the hooved total and the index is a sound %", () => {
    const herd = generateHerd(40, 99);
    const s = summarizeMobility(herd);
    expect(s.dist[0] + s.dist[1] + s.dist[2] + s.dist[3]).toBe(s.total);
    const expectedIndex = Math.round(((s.dist[0] + s.dist[1]) / s.total) * 100);
    expect(s.index).toBe(expectedIndex);
    expect(s.index).toBeGreaterThanOrEqual(0);
    expect(s.index).toBeLessThanOrEqual(100);
    // every "lame" entry really is score >= 2
    for (const it of s.lame) expect(it.m.score).toBeGreaterThanOrEqual(2);
  });
});
