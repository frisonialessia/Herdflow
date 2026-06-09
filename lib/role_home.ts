// Role-tailored home briefing. The same herd, framed for whoever is looking:
// the vet lands on the clinic, the cuidador on the day's work, the gerente on
// the numbers, the dueño on everything. Pure (given herd + ops + a money
// formatter) so it's deterministic and unit-tested; the UI (components/RoleHome)
// just renders it. Demo-safe — no DB.

import { Animal, CaseState } from "./types";
import { herdSummary } from "./mock_data_generator";
import { buildToday } from "./today";
import { summarizeRepro } from "./repro";
import { summarizeCalving } from "./calving";
import { profileFor } from "./profile";
import { dailyFeedCost } from "./breeds";
import { Role } from "./roles";

export interface HomeTile { label: string; value: string; accent?: boolean }
export interface HomeAction { label: string; href: string }
export interface RoleBriefing {
  title: string;
  subtitle: string;
  tiles: HomeTile[];
  actions: HomeAction[];
}

/** Herd-wide daily feed cost, summed from each animal's breed requirement. */
export function herdFeedCost(herd: Animal[]): number {
  return Math.round(herd.reduce((sum, a) => sum + dailyFeedCost(a.species, profileFor(a).breed), 0));
}

export function roleBriefing(
  role: Role,
  herd: Animal[],
  caseFor: (id: string) => CaseState,
  bred: Record<string, string>,
  now: Date,
  fmtMoney: (n: number) => string
): RoleBriefing {
  const s = herdSummary(herd);
  const today = buildToday({ herd, caseFor, bred, now });
  const inHeat = summarizeRepro(herd, bred).counts.inHeat;
  const calving = summarizeCalving(herd).watch.length;
  const openCases = herd.filter((a) => a.status !== "healthy" && caseFor(a.id).status !== "resolved").length;
  const feedDay = herdFeedCost(herd);

  switch (role) {
    case "vet":
      return {
        title: "Panel clínico",
        subtitle: "Casos, expedientes y salud del hato",
        tiles: [
          { label: "Casos abiertos", value: `${openCases}`, accent: true },
          { label: "Críticos", value: `${s.critical}` },
          { label: "En vigilancia", value: `${s.watch}` },
          { label: "Salud del hato", value: `${s.index}%` },
        ],
        actions: [
          { label: "Ver casos", href: "/dashboard/cases" },
          { label: "Movilidad", href: "/dashboard/mobility" },
          { label: "Nutrición", href: "/dashboard/nutrition" },
        ],
      };
    case "herdsman":
      return {
        title: "Tu día",
        subtitle: "Pendientes y monitoreo del hato",
        tiles: [
          { label: "Urgentes hoy", value: `${today.counts.urgent}`, accent: true },
          { label: "Tareas hoy", value: `${today.counts.today}` },
          { label: "En celo", value: `${inHeat}` },
          { label: "Partos próximos", value: `${calving}` },
        ],
        actions: [
          { label: "Pendientes de hoy", href: "/dashboard/today" },
          { label: "Monitoreo en vivo", href: "/dashboard/live" },
          { label: "Casos", href: "/dashboard/cases" },
        ],
      };
    case "manager":
      return {
        title: "Resumen del negocio",
        subtitle: "Operación y finanzas del rancho",
        tiles: [
          { label: "Animales", value: `${herd.length}` },
          { label: "Salud del hato", value: `${s.index}%` },
          { label: "Costo alim./día", value: fmtMoney(feedDay), accent: true },
          { label: "Críticos", value: `${s.critical}` },
        ],
        actions: [
          { label: "Impacto", href: "/dashboard/impact" },
          { label: "Reportes", href: "/dashboard/reports" },
          { label: "Pendientes de hoy", href: "/dashboard/today" },
        ],
      };
    case "viewer":
      return {
        title: "Resumen del hato",
        subtitle: "Vista de solo lectura",
        tiles: [
          { label: "Animales", value: `${herd.length}` },
          { label: "Salud del hato", value: `${s.index}%` },
          { label: "En vigilancia", value: `${s.watch}` },
          { label: "Críticos", value: `${s.critical}` },
        ],
        actions: [
          { label: "Pendientes de hoy", href: "/dashboard/today" },
          { label: "Animales", href: "/dashboard/animals" },
        ],
      };
    case "owner":
    default:
      return {
        title: "Resumen del rancho",
        subtitle: "Todo tu rancho de un vistazo",
        tiles: [
          { label: "Animales", value: `${herd.length}` },
          { label: "Salud del hato", value: `${s.index}%` },
          { label: "Urgentes hoy", value: `${today.counts.urgent}`, accent: true },
          { label: "Costo alim./día", value: fmtMoney(feedDay) },
        ],
        actions: [
          { label: "Equipo y roles", href: "/dashboard/settings" },
          { label: "Impacto", href: "/dashboard/impact" },
          { label: "Pendientes de hoy", href: "/dashboard/today" },
        ],
      };
  }
}
