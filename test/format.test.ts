import { describe, it, expect } from "vitest";
import { fmtZ, fmtMetric, STATUS_LABEL, METRIC_LABEL } from "@/lib/format";

describe("format helpers", () => {
  it("fmtZ shows a signed sigma", () => {
    expect(fmtZ(2)).toBe("+2.0σ");
    expect(fmtZ(-1.5)).toBe("-1.5σ");
    expect(fmtZ(0)).toBe("0.0σ");
  });

  it("fmtMetric formats per metric", () => {
    expect(fmtMetric("temperature_c", 38.47)).toBe("38.5°C");
    expect(fmtMetric("intake_kg", 11.04)).toBe("11.0 kg");
    expect(fmtMetric("activity_index", 60.7)).toBe("61");
    expect(fmtMetric("heart_rate", 64.6)).toBe("65 bpm");
  });

  it("labels cover the Spanish UI", () => {
    expect(STATUS_LABEL.healthy).toBe("Sano");
    expect(STATUS_LABEL.critical).toBe("Crítico");
    expect(METRIC_LABEL.temperature_c).toBe("Temperatura");
  });
});
