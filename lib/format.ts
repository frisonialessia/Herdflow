import { Severity, MetricKey } from "./types";

export const STATUS_COLOR: Record<Severity, string> = {
  healthy: "var(--healthy)",
  watch: "var(--watch)",
  critical: "var(--critical)",
};

export const STATUS_LABEL: Record<Severity, string> = {
  healthy: "Sano",
  watch: "Vigilancia",
  critical: "Crítico",
};

export const METRIC_LABEL: Record<MetricKey, string> = {
  temperature_c: "Temperatura",
  activity_index: "Actividad",
  rumination_min: "Rumia",
  intake_kg: "Consumo",
  heart_rate: "Frecuencia cardíaca",
  respiration_rate: "Respiración",
};

export const METRIC_UNIT: Record<MetricKey, string> = {
  temperature_c: "°C",
  activity_index: "",
  rumination_min: " min",
  intake_kg: " kg",
  heart_rate: " bpm",
  respiration_rate: "/min",
};

/** "2h ago" style relative time from an ISO string. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "ahora mismo";
  if (m < 60) return `hace ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.round(h / 24)}d`;
}

export function fmtMetric(key: MetricKey, value: number): string {
  if (key === "temperature_c") return `${value.toFixed(1)}${METRIC_UNIT[key]}`;
  if (key === "intake_kg") return `${value.toFixed(1)}${METRIC_UNIT[key]}`;
  return `${Math.round(value)}${METRIC_UNIT[key]}`;
}

export function fmtZ(z: number): string {
  return `${z > 0 ? "+" : ""}${z.toFixed(1)}σ`;
}
