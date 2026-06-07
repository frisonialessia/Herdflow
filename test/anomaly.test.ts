import { describe, it, expect } from "vitest";
import { computeBaseline, detectAnomaly, normalBand } from "@/lib/anomaly";
import { metricSeries } from "./helpers";
import type { MetricKey } from "@/lib/types";

describe("computeBaseline", () => {
  it("averages each metric across the window", () => {
    const window = metricSeries("temperature_c", [38, 39, 40, 41]); // mean 39.5
    const b = computeBaseline(window);
    expect(b.temperature_c).toBeCloseTo(39.5, 2);
    // untouched metrics stay at their neutral constant
    expect(b.activity_index).toBeCloseTo(60, 2);
  });
});

describe("detectAnomaly", () => {
  it("flags a clear high-temperature outlier as critical", () => {
    // 12 flat readings then a spike; latest is scored against the rest.
    const series = metricSeries("temperature_c", [...Array(12).fill(38.5), 42.5]);
    const d = detectAnomaly(series);
    expect(d.metric).toBe("temperature_c");
    expect(d.severity).toBe("critical");
    expect(d.z_score).toBeGreaterThan(3);
    expect(d.observed).toBe(42.5);
  });

  it("calls a stationary series healthy", () => {
    const series = metricSeries("temperature_c", Array(13).fill(38.5));
    const d = detectAnomaly(series);
    expect(d.severity).toBe("healthy");
    expect(Math.abs(d.z_score)).toBeLessThanOrEqual(2);
  });

  it("picks the most-deviated metric among the herd", () => {
    // Build a series where activity dives hard while temperature stays flat.
    const base = metricSeries("activity_index", [...Array(12).fill(60), 10]);
    const d = detectAnomaly(base, ["temperature_c", "activity_index", "intake_kg"]);
    expect(d.metric).toBe("activity_index");
    expect(d.z_score).toBeLessThan(0); // a drop is signed negative
  });

  it("ignores metrics not in the species' set", () => {
    // A huge rumination drop is present but excluded; result must come from the
    // allowed metrics only, so it should not report rumination.
    const series = metricSeries("rumination_min", [...Array(12).fill(480), 50]);
    const metrics: MetricKey[] = ["temperature_c", "activity_index", "intake_kg"];
    const d = detectAnomaly(series, metrics);
    expect(metrics).toContain(d.metric);
    expect(d.metric).not.toBe("rumination_min");
  });
});

describe("normalBand", () => {
  it("returns mean ± 2σ", () => {
    const band = normalBand([10, 10, 10, 10]);
    expect(band.mean).toBeCloseTo(10, 5);
    // zero variance is guarded to σ=1, so the band is mean ± 2
    expect(band.lower).toBeCloseTo(8, 5);
    expect(band.upper).toBeCloseTo(12, 5);
  });
});
