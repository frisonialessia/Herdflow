import { describe, it, expect } from "vitest";
import { detectOutbreaks } from "@/lib/outbreak";
import { animalWith } from "./helpers";
import type { Animal, Severity } from "@/lib/types";

// A sick animal at a map position with a given deviated metric.
const sick = (id: string, x: number, y: number, severity: Severity, metric: Animal["deviation"]["metric"] = "temperature_c") =>
  animalWith({
    id,
    x,
    y,
    status: severity,
    deviation: { metric, z_score: severity === "critical" ? 3.4 : 2.4, baseline: 38.5, observed: 41, severity },
  });

describe("detectOutbreaks", () => {
  it("finds a tight cluster that is both broad and severe", () => {
    const herd = [
      sick("a", 50, 50, "critical"),
      sick("b", 52, 51, "critical"),
      sick("c", 48, 49, "watch"),
      animalWith({ id: "far", x: 10, y: 90, status: "healthy" }),
    ];
    const obs = detectOutbreaks(herd);
    expect(obs).toHaveLength(1);
    expect(obs[0].size).toBe(3);
    expect(obs[0].criticalCount).toBe(2);
    expect(obs[0].severity).toBe("critical");
    expect(obs[0].metric).toBe("temperature_c");
    expect(obs[0].animalIds.sort()).toEqual(["a", "b", "c"]);
  });

  it("ignores clusters that are too small", () => {
    const herd = [sick("a", 50, 50, "critical"), sick("b", 52, 51, "critical")];
    expect(detectOutbreaks(herd)).toHaveLength(0);
  });

  it("ignores broad-but-mild clusters (needs ≥2 critical)", () => {
    const herd = [sick("a", 50, 50, "critical"), sick("b", 52, 51, "watch"), sick("c", 48, 49, "watch")];
    expect(detectOutbreaks(herd)).toHaveLength(0);
  });

  it("separates two spatially distinct clusters", () => {
    const herd = [
      sick("a", 20, 20, "critical"),
      sick("b", 22, 21, "critical"),
      sick("c", 21, 23, "critical"),
      sick("d", 80, 80, "critical"),
      sick("e", 82, 81, "critical"),
      sick("f", 79, 82, "critical"),
    ];
    expect(detectOutbreaks(herd)).toHaveLength(2);
  });

  it("is deterministic", () => {
    const herd = [sick("a", 50, 50, "critical"), sick("b", 52, 51, "critical"), sick("c", 48, 49, "watch")];
    expect(detectOutbreaks(herd)).toEqual(detectOutbreaks(herd));
  });
});
