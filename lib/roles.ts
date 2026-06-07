// Roles & permissions. The demo lets you switch role to preview each view; in
// production the role comes from the authenticated user. Capabilities gate what
// each role can see (finance) and do (manage the herd / medical records).
//
//   Owner      — full access: operations, health and finances.
//   Caretaker  — daily operations: add animals, work cases, breeding, feeding.
//   Vet        — health & medical records: cases, diagnoses, vaccines, history.

export type Role = "owner" | "caretaker" | "vet";

export type Capability =
  | "finance" // Impact + Reports (business numbers)
  | "addAnimal"
  | "deleteAnimal"
  | "editAnimal" // identity / husbandry
  | "editMedical" // vaccines + medical history
  | "manageCases"
  | "manageBreeding";

export const ROLE_ORDER: Role[] = ["owner", "caretaker", "vet"];

export const ROLE_LABEL: Record<Role, string> = { owner: "Dueño", caretaker: "Cuidador", vet: "Veterinario" };
export const ROLE_DESC: Record<Role, string> = {
  owner: "Acceso total: operación, salud y finanzas",
  caretaker: "Operación diaria del hato",
  vet: "Salud y expedientes médicos",
};
export const ROLE_COLOR: Record<Role, string> = { owner: "var(--sage-deep)", caretaker: "var(--brown)", vet: "var(--critical)" };

const MATRIX: Record<Role, Capability[]> = {
  owner: ["finance", "addAnimal", "deleteAnimal", "editAnimal", "editMedical", "manageCases", "manageBreeding"],
  caretaker: ["addAnimal", "editAnimal", "manageCases", "manageBreeding"],
  vet: ["editAnimal", "editMedical", "manageCases", "manageBreeding"],
};

export function can(role: Role, cap: Capability): boolean {
  return MATRIX[role].includes(cap);
}

export function isRole(v: string | null): v is Role {
  return v === "owner" || v === "caretaker" || v === "vet";
}
