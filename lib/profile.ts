// Animal husbandry profiles — breeds, vaccines, feeding and the helpers to
// generate a sensible default profile per species and to display age.

import { Animal, Species, Sex, AnimalProfile, VaccineRecord } from "./types";

export const BREEDS: Record<Species, string[]> = {
  dairy: ["Holstein", "Jersey", "Brown Swiss", "Guernsey", "Pardo Suizo"],
  beef: ["Angus", "Hereford", "Charolais", "Brahman", "Beefmaster"],
  sheep: ["Katahdin", "Dorper", "Suffolk", "Merino", "Pelibuey"],
  horse: ["Cuarto de Milla", "Criollo", "Azteca", "Pura Sangre", "Frisón"],
  poultry: ["Rhode Island Red", "Leghorn", "Plymouth Rock", "Sussex"],
};

const DIET: Record<Species, string> = {
  dairy: "TMR (ensilado + concentrado)",
  beef: "Pastoreo + grano de finalización",
  sheep: "Pastoreo + heno",
  horse: "Heno + avena",
  poultry: "Alimento balanceado (postura)",
};

const FEEDING: Record<Species, string> = {
  dairy: "05:30, 13:00, 19:30",
  beef: "07:00, 17:00",
  sheep: "07:30, 17:30",
  horse: "06:00, 12:00, 18:00",
  poultry: "Libre acceso",
};

const WATER: Record<Species, [number, number]> = {
  dairy: [70, 130],
  beef: [40, 70],
  sheep: [4, 10],
  horse: [25, 45],
  poultry: [0.2, 0.5],
};

const AGE_RANGE: Record<Species, [number, number]> = {
  dairy: [1.5, 7],
  beef: [1, 5],
  sheep: [0.8, 5],
  horse: [2, 16],
  poultry: [0.3, 2],
};

const VACCINES: Record<Species, string[]> = {
  dairy: ["Brucelosis (RB51)", "Fiebre aftosa", "IBR / DVB", "Carbón sintomático"],
  beef: ["Fiebre aftosa", "Carbón sintomático", "Clostridiales", "Rabia paralítica"],
  sheep: ["Clostridiales", "Carbón sintomático", "Ectima contagioso"],
  horse: ["Influenza equina", "Tétanos", "Encefalitis equina", "Rabia"],
  poultry: ["Newcastle", "Bronquitis infecciosa", "Gumboro"],
};

const PAST_ISSUES: Record<Species, string[]> = {
  dairy: ["Mastitis tratada (2024)", "Cojera leve resuelta", "Cetosis posparto"],
  beef: ["Neumonía tratada (2024)", "Conjuntivitis (pink-eye)"],
  sheep: ["Pietín tratado", "Parásitos gastrointestinales"],
  horse: ["Cólico leve resuelto", "Absceso de casco"],
  poultry: ["Coccidiosis tratada"],
};

const RANCHES = ["Rancho La Esperanza", "Ganadería Los Encinos", "Rancho El Sauce", "Establo San José"];
const FEMALE_ONLY: Species[] = ["dairy"];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function generateProfile(sp: Species, rnd: () => number): AnimalProfile {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

  const [amin, amax] = AGE_RANGE[sp];
  const ageY = amin + rnd() * (amax - amin);
  const sex: Sex = FEMALE_ONLY.includes(sp) ? "female" : rnd() < (sp === "poultry" ? 0.85 : 0.7) ? "female" : "male";
  const [wmin, wmax] = WATER[sp];

  // Two vaccines with recent-ish dates.
  const pool = [...VACCINES[sp]];
  const vaccines: VaccineRecord[] = [];
  for (let i = 0; i < Math.min(2, pool.length); i++) {
    const idx = Math.floor(rnd() * pool.length);
    vaccines.push({ name: pool.splice(idx, 1)[0], date: isoDaysAgo(Math.round(30 + rnd() * 300)) });
  }

  return {
    sex,
    breed: pick(BREEDS[sp]),
    birthDate: isoDaysAgo(Math.round(ageY * 365.25)),
    origin: rnd() < 0.6 ? "Nacido en el rancho" : `Comprado · ${pick(RANCHES)}`,
    location: pick(RANCHES),
    diet: DIET[sp],
    feedingTimes: FEEDING[sp],
    waterIntakeL: +(wmin + rnd() * (wmax - wmin)).toFixed(sp === "poultry" ? 2 : 0),
    vaccines,
    medicalHistory: rnd() < 0.28 ? pick(PAST_ISSUES[sp]) : "Sin antecedentes",
  };
}

/** Human age from a birth date, e.g. "8 mo" or "3.5 yr". */
export function animalAge(birthDate: string): string {
  const days = (Date.now() - new Date(birthDate).getTime()) / 86_400_000;
  if (!birthDate || isNaN(days)) return "—";
  if (days < 365) return `${Math.max(1, Math.round(days / 30))} mo`;
  const y = days / 365.25;
  return `${y < 3 ? y.toFixed(1) : Math.round(y)} yr`;
}

export const SEX_LABEL: Record<Sex, string> = { female: "Hembra", male: "Macho" };

// Deterministic seeded RNG from an id, for generating a stable default profile
// when one is missing (e.g. DB-mode rows that predate profiles).
function rndFromId(id: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return function () {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The animal's profile, or a stable generated default if it has none. */
export function profileFor(a: Animal): AnimalProfile {
  return a.profile ?? generateProfile(a.species, rndFromId(a.id));
}
