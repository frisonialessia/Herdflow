import { describe, it, expect } from "vitest";
import { analyzeForecast } from "@/lib/forecast";
import { animalWith, metricSeries } from "./helpers";
import type { Deviation } from "@/lib/types";

const tempDev: Deviation = { metric: "temperature_c", z_score: 0, baseline: 38.5, observed: 0, severity: "healthy" };

describe("analyzeForecast", () => {
  it("returns null without enough history", () => {
    const a = animalWith({ deviation: tempDev, series: metricSeries("temperature_c", [38.5, 38.6, 38.4, 38.5, 38.5]) });
    expect(analyzeForecast(a)).toBeNull();
  });

  it("reads an already-critical rising fever and quantifies the lead time", () => {
    const values = [...Array(12).fill(38.5), 39.5, 40.5, 41.5, 42.5, 43.5, 44.5];
    const a = animalWith({ deviation: tempDev, status: "critical", series: metricSeries("temperature_c", values) });
    const f = analyzeForecast(a)!;
    expect(f.direction).toBe("rising");
    expect(f.level).toBe("critical");
    expect(f.alreadyCritical).toBe(true);
    expect(f.firstFlagAt).not.toBeNull();
    expect(f.projectionHours).toBeNull(); // already critical — nothing to project to
    expect(f.projectionValues).toHaveLength(6);
  });

  it("projects a still-climbing watch case toward critical", () => {
    const values = [...Array(12).fill(38.5), 39.0, 39.5, 40.0, 40.5, 41.0];
    const a = animalWith({ deviation: tempDev, status: "watch", series: metricSeries("temperature_c", values) });
    const f = analyzeForecast(a)!;
    expect(f.level).toBe("watch");
    expect(f.alreadyCritical).toBe(false);
    expect(f.projectionHours).not.toBeNull();
    expect(f.projectionHours!).toBeGreaterThan(0);
  });
});
