import { describe, it, expect } from "vitest";
import {
  can,
  isRole,
  capabilitiesOf,
  CAPABILITY_LABEL,
  ROLE_ORDER,
  ROLE_LABEL,
  ROLE_DESC,
  ROLE_COLOR,
  type Capability,
  type Role,
} from "@/lib/roles";

const ALL_CAPS: Capability[] = [
  "finance",
  "integrations",
  "manageTeam",
  "addAnimal",
  "deleteAnimal",
  "editAnimal",
  "editMedical",
  "manageCases",
  "manageBreeding",
];

describe("roles: capability matrix", () => {
  it("owner can do everything", () => {
    for (const cap of ALL_CAPS) expect(can("owner", cap)).toBe(true);
  });

  it("viewer can do nothing", () => {
    for (const cap of ALL_CAPS) expect(can("viewer", cap)).toBe(false);
  });

  it("manager runs operations + finance but not device/API integrations", () => {
    expect(can("manager", "finance")).toBe(true);
    expect(can("manager", "deleteAnimal")).toBe(true);
    expect(can("manager", "integrations")).toBe(false);
  });

  it("herdsman works the daily loop but not finance, medical or deletion", () => {
    expect(can("herdsman", "addAnimal")).toBe(true);
    expect(can("herdsman", "manageCases")).toBe(true);
    expect(can("herdsman", "manageBreeding")).toBe(true);
    expect(can("herdsman", "deleteAnimal")).toBe(false);
    expect(can("herdsman", "editMedical")).toBe(false);
    expect(can("herdsman", "finance")).toBe(false);
    expect(can("herdsman", "integrations")).toBe(false);
  });

  it("vet owns medical records but cannot add/delete animals or see finance", () => {
    expect(can("vet", "editMedical")).toBe(true);
    expect(can("vet", "manageCases")).toBe(true);
    expect(can("vet", "addAnimal")).toBe(false);
    expect(can("vet", "deleteAnimal")).toBe(false);
    expect(can("vet", "finance")).toBe(false);
  });

  it("only the owner can manage the team", () => {
    expect(can("owner", "manageTeam")).toBe(true);
    for (const role of ["manager", "herdsman", "vet", "viewer"] as Role[]) {
      expect(can(role, "manageTeam")).toBe(false);
    }
  });

  it("owner is a superset of every other role", () => {
    for (const role of ROLE_ORDER) {
      for (const cap of ALL_CAPS) {
        if (can(role, cap)) expect(can("owner", cap)).toBe(true);
      }
    }
  });
});

describe("roles: metadata is complete", () => {
  it("has 5 unique roles in order", () => {
    expect(ROLE_ORDER).toEqual(["owner", "manager", "herdsman", "vet", "viewer"]);
    expect(new Set(ROLE_ORDER).size).toBe(5);
  });

  it("every role has a label, description and color", () => {
    for (const role of ROLE_ORDER) {
      expect(ROLE_LABEL[role]).toBeTruthy();
      expect(ROLE_DESC[role]).toBeTruthy();
      expect(ROLE_COLOR[role]).toBeTruthy();
    }
  });

  it("every capability a role holds has a human label (for the catalog)", () => {
    for (const role of ROLE_ORDER) {
      for (const cap of capabilitiesOf(role)) {
        expect(CAPABILITY_LABEL[cap]).toBeTruthy();
      }
    }
  });
});

describe("roles: isRole guard", () => {
  it("accepts the five DB enum values", () => {
    for (const role of ROLE_ORDER) expect(isRole(role)).toBe(true);
  });

  it("rejects anything else", () => {
    for (const bad of ["admin", "", "Owner", null, undefined] as (string | null | undefined)[]) {
      expect(isRole(bad)).toBe(false);
    }
  });

  it("narrows the type when true", () => {
    const v: string = "vet";
    if (isRole(v)) {
      const r: Role = v; // compiles only if narrowed to Role
      expect(r).toBe("vet");
    }
  });
});
