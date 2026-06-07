import { describe, it, expect } from "vitest";
import { GESTATION, calvingOf, calvingLabel, summarizeCalving } from "@/lib/calving";
import { generateHerd } from "@/lib/mock_data_generator";
import { animalWith } from "./helpers";

describe("calving basics", () => {
  it("uses real gestation lengths", () => {
    expect(GESTATION.dairy).toBe(283);
    expect(GESTATION.beef).toBe(285);
    expect(GESTATION.sheep).toBe(147);
  });

  it("only breedable ruminants can calve", () => {
    expect(calvingOf(animalWith({ species: "poultry" }))).toBeNull();
    expect(calvingOf(animalWith({ species: "horse" }))).toBeNull();
  });

  it("calvingLabel reads naturally in Spanish", () => {
    expect(calvingLabel(-2)).toBe("Atrasada 2 d");
    expect(calvingLabel(0)).toBe("Parto hoy");
    expect(calvingLabel(12)).toBe("Faltan ~12 d");
  });
});

describe("calvingOf is pure", () => {
  it("returns the same result for the same animal", () => {
    for (const a of generateHerd(20, 99)) {
      expect(calvingOf(a)).toEqual(calvingOf(a));
    }
  });
});

describe("summarizeCalving", () => {
  it("buckets partition the pregnant cows; the watch list is the non-carrying ones", () => {
    const s = summarizeCalving(generateHerd(40, 99));
    const { overdue, imminent, dueSoon, carrying, pregnant } = s.counts;
    expect(overdue + imminent + dueSoon + carrying).toBe(pregnant);
    expect(s.watch.length).toBe(overdue + imminent + dueSoon);
  });
});
