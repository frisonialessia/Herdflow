import { describe, it, expect } from "vitest";
import { hash01, isBreedable, reproOf, aiWindow, summarizeRepro, CYCLE_DAYS } from "@/lib/repro";
import { generateHerd } from "@/lib/mock_data_generator";
import { animalWith } from "./helpers";
import type { AnimalProfile, Sex } from "@/lib/types";

const prof = (sex: Sex): AnimalProfile => ({
  sex,
  breed: "",
  birthDate: "",
  origin: "",
  location: "",
  diet: "",
  feedingTimes: "",
  waterIntakeL: 0,
  vaccines: [],
  medicalHistory: "",
});

describe("hash01", () => {
  it("is deterministic and within [0,1)", () => {
    expect(hash01("an-3")).toBe(hash01("an-3"));
    for (const s of ["a", "an-1", "long-id-xyz", ""]) {
      const v = hash01(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("isBreedable", () => {
  it("covers breedable ruminant females' species only", () => {
    expect(isBreedable(animalWith({ species: "dairy" }))).toBe(true);
    expect(isBreedable(animalWith({ species: "beef" }))).toBe(true);
    expect(isBreedable(animalWith({ species: "sheep" }))).toBe(true);
    expect(isBreedable(animalWith({ species: "horse" }))).toBe(false);
    expect(isBreedable(animalWith({ species: "poultry" }))).toBe(false);
  });
});

describe("reproOf", () => {
  it("returns null for males and non-breedable species", () => {
    expect(reproOf(animalWith({ species: "dairy", profile: prof("male") }))).toBeNull();
    expect(reproOf(animalWith({ species: "horse", profile: prof("female") }))).toBeNull();
  });

  it("marks a cow as bred when the user recorded insemination", () => {
    const r = reproOf(animalWith({ species: "dairy", profile: prof("female") }), true);
    expect(r?.status).toBe("bred");
  });
});

describe("aiWindow", () => {
  it("walks soon → open → closing → missed as onset ages", () => {
    expect(aiWindow(2).state).toBe("soon");
    expect(aiWindow(6).state).toBe("open");
    expect(aiWindow(18).state).toBe("open");
    expect(aiWindow(20).state).toBe("closing");
    expect(aiWindow(30).state).toBe("missed");
  });
});

describe("summarizeRepro", () => {
  it("uses a 21-day cycle and partitions breedable females by status", () => {
    expect(CYCLE_DAYS).toBe(21);
    const s = summarizeRepro(generateHerd(40, 99));
    const { inHeat, approaching, open, bred, pregnant, breedable } = s.counts;
    expect(inHeat + approaching + open + bred + pregnant).toBe(breedable);
  });
});
