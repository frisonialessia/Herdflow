import { describe, it, expect } from "vitest";
import { inferCondition } from "@/lib/conditions";
import { animalWith } from "./helpers";
import type { Deviation } from "@/lib/types";

const dev = (over: Partial<Deviation>): Deviation => ({
  metric: "temperature_c",
  z_score: 0,
  baseline: 0,
  observed: 0,
  severity: "watch",
  ...over,
});

describe("inferCondition", () => {
  it("is 'Normal' when healthy", () => {
    expect(inferCondition(animalWith({ status: "healthy" })).short).toBe("Normal");
  });

  it("maps a temperature spike to fever/mastitis", () => {
    const a = animalWith({ status: "critical", deviation: dev({ metric: "temperature_c", z_score: 3.5 }) });
    expect(inferCondition(a).label.toLowerCase()).toContain("fiebre");
  });

  it("distinguishes rising activity (heat) from falling activity (lameness)", () => {
    const heat = animalWith({ status: "watch", deviation: dev({ metric: "activity_index", z_score: 2.4 }) });
    const lame = animalWith({ status: "watch", deviation: dev({ metric: "activity_index", z_score: -2.4 }) });
    expect(inferCondition(heat).short).toBe("¿Celo?");
    expect(inferCondition(lame).short).toBe("¿Cojera?");
  });

  it("maps low intake/rumination to off-feed", () => {
    const a = animalWith({ status: "watch", deviation: dev({ metric: "rumination_min", z_score: -2.5 }) });
    expect(inferCondition(a).short).toBe("Inapetente");
  });
});
