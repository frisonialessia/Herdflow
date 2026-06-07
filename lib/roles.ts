// Roles & permissions. The role set matches the DB enum (member_role) one-to-one
// so there's a single source of truth: in production the role comes from the
// user's membership; the demo lets you preview each. Capabilities gate what each
// role can see (finance, integrations) and do (manage the herd / medical records).
//
//   Propietario (owner)   — full access: operations, health, finances, devices.
//   Gerente (manager)     — operations + finances; not device/API keys.
//   Cuidador (herdsman)   — daily operations: add animals, work cases, breeding.
//   Veterinario (vet)     — health & medical records: cases, vaccines, history.
//   Lector (viewer)       — read-only.

export type Role = "owner" | "manager" | "herdsman" | "vet" | "viewer";

export type Capability =
  | "finance" // Impact + Reports (business numbers)
  | "integrations" // connect devices / manage API keys
  | "addAnimal"
  | "deleteAnimal"
  | "editAnimal" // identity / husbandry
  | "editMedical" // vaccines + medical history
  | "manageCases"
  | "manageBreeding";

export const ROLE_ORDER: Role[] = ["owner", "manager", "herdsman", "vet", "viewer"];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Propietario",
  manager: "Gerente",
  herdsman: "Cuidador",
  vet: "Veterinario",
  viewer: "Lector",
};
export const ROLE_DESC: Record<Role, string> = {
  owner: "Acceso total: operación, salud y finanzas",
  manager: "Operación y finanzas del hato",
  herdsman: "Operación diaria del hato",
  vet: "Salud y expedientes médicos",
  viewer: "Solo lectura",
};
export const ROLE_COLOR: Record<Role, string> = {
  owner: "var(--sage-deep)",
  manager: "var(--olive)",
  herdsman: "var(--brown)",
  vet: "var(--critical)",
  viewer: "var(--faint)",
};

const MATRIX: Record<Role, Capability[]> = {
  owner: ["finance", "integrations", "addAnimal", "deleteAnimal", "editAnimal", "editMedical", "manageCases", "manageBreeding"],
  manager: ["finance", "addAnimal", "deleteAnimal", "editAnimal", "editMedical", "manageCases", "manageBreeding"],
  herdsman: ["addAnimal", "editAnimal", "manageCases", "manageBreeding"],
  vet: ["editAnimal", "editMedical", "manageCases", "manageBreeding"],
  viewer: [],
};

export function can(role: Role, cap: Capability): boolean {
  return MATRIX[role].includes(cap);
}

export function isRole(v: string | null | undefined): v is Role {
  return v === "owner" || v === "manager" || v === "herdsman" || v === "vet" || v === "viewer";
}
