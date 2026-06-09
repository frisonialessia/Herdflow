// Breed-level husbandry data. Species alone is too coarse — a Holstein and a
// Jersey are both "dairy" but differ in size, intake, yield and what tends to go
// wrong with them. This catalog makes the breed actually drive the ficha:
// feeding (kg/day), typical weight, climate fit, temperament, the health issues
// to watch for, and an illustrative daily feed cost. Pure data — no DB, demo-safe.

import { Species } from "./types";

export interface BreedInfo {
  weightKg: number; // typical adult weight
  purpose: string; // Leche / Carne / Lana / Trabajo / Postura…
  feedKgDay: number; // approx feed (dry matter) per day
  climate: string; // climate fit
  temperament: string;
  predispositions: string[]; // health risks to watch for this breed
  care: string; // one-line husbandry note
  yield?: string; // production note (milk L/day, eggs/yr…)
}

export const BREED_INFO: Record<Species, Record<string, BreedInfo>> = {
  dairy: {
    Holstein: { weightKg: 680, purpose: "Leche", feedKgDay: 22, climate: "Templado · sensible al calor", temperament: "Dócil", predispositions: ["Mastitis", "Cojera (laminitis)", "Cetosis", "Estrés calórico"], care: "Alta producción: requiere sombra, ventilación y ración constante.", yield: "28–34 L/día" },
    Jersey: { weightKg: 450, purpose: "Leche (alta grasa)", feedKgDay: 16, climate: "Adaptable · tolera calor", temperament: "Activa, dócil", predispositions: ["Hipocalcemia (fiebre de leche)", "Cetosis", "Mastitis"], care: "Leche rica en grasa; vigilar calcio al parto.", yield: "20–25 L/día" },
    "Brown Swiss": { weightKg: 600, purpose: "Leche / doble propósito", feedKgDay: 20, climate: "Rústica · soporta altura y calor", temperament: "Tranquila", predispositions: ["Mastitis", "Cojera"], care: "Rústica y longeva; buena para clima variable.", yield: "22–28 L/día" },
    "Pardo Suizo": { weightKg: 600, purpose: "Leche / doble propósito", feedKgDay: 20, climate: "Rústica · soporta altura y calor", temperament: "Tranquila", predispositions: ["Mastitis", "Cojera"], care: "Rústica y longeva; buena para clima variable.", yield: "22–28 L/día" },
    Guernsey: { weightKg: 500, purpose: "Leche (beta-caroteno)", feedKgDay: 17, climate: "Templado", temperament: "Dócil", predispositions: ["Cetosis", "Mastitis"], care: "Leche amarilla rica; eficiente en pastoreo.", yield: "20–24 L/día" },
  },
  beef: {
    Angus: { weightKg: 850, purpose: "Carne (marmoleo)", feedKgDay: 12, climate: "Templado", temperament: "Dócil", predispositions: ["Enfermedad respiratoria (BRD)", "Timpanismo"], care: "Marmoleo premium; engorda eficiente en corral.", yield: "Canal de alta calidad" },
    Hereford: { weightKg: 800, purpose: "Carne", feedKgDay: 11, climate: "Adaptable", temperament: "Muy dócil", predispositions: ["Cáncer de ojo (pink-eye)", "Fotosensibilidad"], care: "Rústico para pastoreo extensivo; vigilar ojos por sol." },
    Charolais: { weightKg: 1000, purpose: "Carne (magra)", feedKgDay: 14, climate: "Templado", temperament: "Activo", predispositions: ["Distocia (partos difíciles)", "BRD"], care: "Gran tamaño y crecimiento; cuidar el parto en vaquillas." },
    Brahman: { weightKg: 800, purpose: "Carne (cebú)", feedKgDay: 10, climate: "Tropical / calor · excelente", temperament: "Alerta", predispositions: ["Sensible al frío"], care: "Resistente a calor, garrapatas y parásitos; ideal trópico." },
    Beefmaster: { weightKg: 900, purpose: "Carne (compuesto)", feedKgDay: 12, climate: "Tropical / templado", temperament: "Dócil", predispositions: ["BRD"], care: "Híbrido resistente; buena fertilidad y rusticidad." },
  },
  sheep: {
    Katahdin: { weightKg: 75, purpose: "Carne (pelo)", feedKgDay: 2.2, climate: "Adaptable", temperament: "Dócil", predispositions: ["Parásitos gastrointestinales", "Pietín"], care: "Oveja de pelo, sin esquila; resistente a parásitos." },
    Dorper: { weightKg: 85, purpose: "Carne (pelo)", feedKgDay: 2.4, climate: "Árido / calor", temperament: "Dócil", predispositions: ["Pietín", "Parásitos"], care: "Crece rápido; excelente en clima seco." },
    Suffolk: { weightKg: 110, purpose: "Carne", feedKgDay: 2.8, climate: "Templado", temperament: "Activo", predispositions: ["Pietín", "Parásitos", "Mastitis"], care: "Corderos grandes y rápidos; requiere esquila." },
    Merino: { weightKg: 80, purpose: "Lana fina", feedKgDay: 2.0, climate: "Templado / seco", temperament: "Gregario", predispositions: ["Miasis (gusaneras)", "Pietín"], care: "Lana premium; vigilar pliegues y humedad." },
    Pelibuey: { weightKg: 60, purpose: "Carne (pelo)", feedKgDay: 1.8, climate: "Tropical · excelente", temperament: "Rústico", predispositions: ["Parásitos"], care: "Ovino de pelo tropical, muy rústico y prolífico." },
  },
  horse: {
    "Cuarto de Milla": { weightKg: 500, purpose: "Trabajo / velocidad", feedKgDay: 9, climate: "Adaptable", temperament: "Dócil, versátil", predispositions: ["Cólico", "Laminitis", "Miopatías"], care: "Versátil para ganado y carrera corta; cuidar cascos." },
    Criollo: { weightKg: 420, purpose: "Trabajo / resistencia", feedKgDay: 7.5, climate: "Rústico", temperament: "Noble, resistente", predispositions: ["Cólico"], care: "Muy rústico y resistente; bajo mantenimiento." },
    Azteca: { weightKg: 480, purpose: "Charrería / monta", feedKgDay: 8.5, climate: "Templado", temperament: "Elegante, dócil", predispositions: ["Cólico", "Laminitis"], care: "Raza mexicana de charrería; manejo y herraje regulares." },
    "Pura Sangre": { weightKg: 500, purpose: "Carrera", feedKgDay: 10, climate: "Templado", temperament: "Nervioso, atlético", predispositions: ["Úlceras gástricas", "Lesiones de tendón", "Cólico"], care: "Atleta de élite; dieta y ejercicio muy controlados." },
    Frisón: { weightKg: 650, purpose: "Tiro / exhibición", feedKgDay: 11, climate: "Templado / frío", temperament: "Dócil, imponente", predispositions: ["Dermatitis de cuartillas", "Megaesófago"], care: "Gran talla; cuidar la piel de las cuartillas." },
  },
  poultry: {
    "Rhode Island Red": { weightKg: 2.9, purpose: "Doble propósito / postura", feedKgDay: 0.12, climate: "Adaptable", temperament: "Rústico", predispositions: ["Coccidiosis", "Piojos / ácaros"], care: "Buena postura y rusticidad.", yield: "~250 huevos/año" },
    Leghorn: { weightKg: 2.0, purpose: "Postura (huevo blanco)", feedKgDay: 0.1, climate: "Tolera calor", temperament: "Activo, nervioso", predispositions: ["Coccidiosis", "Picaje / canibalismo"], care: "Ponedora élite, muy eficiente.", yield: "~300 huevos/año" },
    "Plymouth Rock": { weightKg: 3.4, purpose: "Doble propósito", feedKgDay: 0.13, climate: "Adaptable / frío", temperament: "Dócil", predispositions: ["Coccidiosis", "Sobrepeso"], care: "Carne y huevo; tranquila y resistente.", yield: "~220 huevos/año" },
    Sussex: { weightKg: 3.2, purpose: "Doble propósito", feedKgDay: 0.12, climate: "Adaptable", temperament: "Curiosa, dócil", predispositions: ["Coccidiosis", "Ácaros"], care: "Buena para traspatio.", yield: "~240 huevos/año" },
  },
};

const DEFAULTS: Record<Species, BreedInfo> = {
  dairy: { weightKg: 550, purpose: "Leche", feedKgDay: 18, climate: "Templado", temperament: "Dócil", predispositions: ["Mastitis", "Cojera"], care: "Vaca lechera; ración balanceada y ordeño regular.", yield: "20–28 L/día" },
  beef: { weightKg: 800, purpose: "Carne", feedKgDay: 12, climate: "Adaptable", temperament: "Dócil", predispositions: ["BRD", "Timpanismo"], care: "Ganado de engorda; vigilar respiratorio y rumen." },
  sheep: { weightKg: 80, purpose: "Carne", feedKgDay: 2.3, climate: "Adaptable", temperament: "Gregario", predispositions: ["Parásitos", "Pietín"], care: "Ovino; desparasitar y revisar pezuñas." },
  horse: { weightKg: 480, purpose: "Trabajo", feedKgDay: 9, climate: "Adaptable", temperament: "Dócil", predispositions: ["Cólico", "Laminitis"], care: "Equino; forraje constante y herraje regular." },
  poultry: { weightKg: 2.8, purpose: "Doble propósito", feedKgDay: 0.12, climate: "Adaptable", temperament: "Rústico", predispositions: ["Coccidiosis"], care: "Ave de corral; bioseguridad y cama seca.", yield: "~230 huevos/año" },
};

/** Breed husbandry data, falling back to a sensible per-species default. */
export function breedInfo(species: Species, breed?: string | null): BreedInfo {
  return (breed && BREED_INFO[species]?.[breed]) || DEFAULTS[species];
}

// Illustrative feed price per kg by species (nominal, like the rest of the app's
// money — swap for real prices when costs go live).
export const FEED_PRICE_PER_KG: Record<Species, number> = { dairy: 6.5, beef: 6, sheep: 7, horse: 8, poultry: 9 };

/** Illustrative daily feed cost for an animal of this breed. */
export function dailyFeedCost(species: Species, breed?: string | null): number {
  return Math.round(breedInfo(species, breed).feedKgDay * FEED_PRICE_PER_KG[species]);
}
