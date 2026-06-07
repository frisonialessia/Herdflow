import { describe, it, expect } from "vitest";
import { generateHerd, generateAnimal, herdSummary } from "@/lib/mock_data_generator";
import type { Animal } from "@/lib/types";

// Fields that come purely from the seeded RNG (not the wall clock), so they are
// reproducible regardless of when the generator runs.
const fingerprint = (herd: Animal[]) =>
  herd.map((a) => ({ id: a.id, name: a.name, species: a.species, tag_id: a.tag_id, x: a.x, y: a.y, sex: a.profile?.sex, breed: a.profile?.breed }));

describe("generateHerd", () => {
  it("is deterministic for a given seed", () => {
    expect(fingerprint(generateHerd(12, 99))).toEqual(fingerprint(generateHerd(12, 99)));
  });

  it("produces a different herd for a different seed", () => {
    expect(fingerprint(generateHerd(12, 99))).not.toEqual(fingerprint(generateHerd(12, 7)));
  });

  it("respects the requested size and a well-formed shape", () => {
    const herd = generateHerd(20, 1);
    expect(herd).toHaveLength(20);
    for (const a of herd) {
      expect(a.series.length).toBeGreaterThan(8);
      expect(a.profile).toBeDefined();
      expect(["healthy", "watch", "critical"]).toContain(a.status);
      // latest carries all six metrics
      for (const k of ["temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate"] as const) {
        expect(typeof a.latest[k]).toBe("number");
      }
    }
  });

  it("sorts critical/watch ahead of healthy", () => {
    const order = { critical: 0, watch: 1, healthy: 2 } as const;
    const herd = generateHerd(40, 99);
    for (let i = 1; i < herd.length; i++) {
      expect(order[herd[i - 1].status]).toBeLessThanOrEqual(order[herd[i].status]);
    }
  });
});

describe("generateAnimal", () => {
  it("is deterministic for a given seed", () => {
    const a = generateAnimal(0, 1234);
    const b = generateAnimal(0, 1234);
    expect(fingerprint([a])).toEqual(fingerprint([b]));
  });
});

describe("herdSummary", () => {
  it("partitions the herd and computes a health index", () => {
    const herd = generateHerd(40, 99);
    const s = herdSummary(herd);
    expect(s.total).toBe(40);
    expect(s.healthy + s.watch + s.critical).toBe(40);
    expect(s.index).toBeCloseTo(+((s.healthy / 40) * 100).toFixed(1), 5);
  });

  it("an empty herd is 100% healthy by definition", () => {
    expect(herdSummary([]).index).toBe(100);
  });
});
