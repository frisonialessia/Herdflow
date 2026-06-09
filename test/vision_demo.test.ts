import { describe, it, expect } from "vitest";
import { analyzeAnimalImage } from "@/lib/vision_demo";
import type { Severity } from "@/lib/types";

const SEVS: Severity[] = ["healthy", "watch", "critical"];

describe("analyzeAnimalImage (simulated)", () => {
  it("is deterministic for the same image", () => {
    expect(analyzeAnimalImage("dairy", "critical", "img-1")).toEqual(analyzeAnimalImage("dairy", "critical", "img-1"));
  });

  it("always returns a well-formed, honestly-flagged finding", () => {
    for (let i = 0; i < 30; i++) {
      const f = analyzeAnimalImage(i % 2 ? "sheep" : "beef", SEVS[i % 3], `seed-${i}`);
      expect(f.simulated).toBe(true);
      expect(SEVS).toContain(f.severity);
      expect(f.condition.length).toBeGreaterThan(0);
      expect(f.confidence).toBeGreaterThanOrEqual(0);
      expect(f.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("mirrors the animal's sensor status for cattle", () => {
    // cattle catalog has both watch and critical visual findings
    expect(analyzeAnimalImage("dairy", "critical", "x").severity).toBe("critical");
    expect(analyzeAnimalImage("dairy", "watch", "x").severity).toBe("watch");
  });

  it("a healthy animal is usually cleared", () => {
    let healthy = 0;
    for (let i = 0; i < 40; i++) if (analyzeAnimalImage("dairy", "healthy", `h-${i}`).severity === "healthy") healthy++;
    expect(healthy).toBeGreaterThan(20); // ~80% modelled
  });
});
