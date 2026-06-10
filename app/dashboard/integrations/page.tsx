"use client";

// Integrations — connect devices and feed the herd with real readings. Built
// around the real ingest endpoint (POST /api/v1/readings): shows the per-ranch
// API key (generate / reveal / copy / regenerate), a live "test" call, and a
// catalog of device adapters. Owner-only.

import { useEffect, useState } from "react";
import { useRole } from "@/components/RoleProvider";
import { can } from "@/lib/roles";
import { NoAccess } from "@/components/NoAccess";
import { MetricKey } from "@/lib/types";
import { METRIC_LABEL } from "@/lib/format";
import { Cable, KeyRound, Copy, Check, RefreshCw, Eye, EyeOff, Terminal, Radio, Scale, CloudSun, ScanLine, Milk, Droplets, Thermometer, Stethoscope, Camera, FlaskConical, Footprints, Baby, MapPin, Wheat, Database, LucideIcon } from "lucide-react";

interface Device {
  id: string;
  name: string;
  vendor: string;
  desc: string;
  metrics: MetricKey[];
  icon: LucideIcon;
  feeds?: string; // when it doesn't map to a tracked metric directly
}

const CATALOG: Device[] = [
  { id: "collar", name: "Collar de actividad y temperatura", vendor: "Allflex · SCR · Nedap", desc: "Actividad, rumia y temperatura por animal, 24/7.", metrics: ["activity_index", "temperature_c", "rumination_min"], icon: Radio },
  { id: "weather", name: "Estación meteorológica", vendor: "Davis · Ambient Weather", desc: "Temperatura y humedad del rancho → índice de calor (THI).", metrics: [], feeds: "Estrés calórico (THI)", icon: CloudSun },
  { id: "scale", name: "Báscula inteligente", vendor: "Tru-Test · Gallagher", desc: "Peso al pasar por el corral; alimenta condición corporal.", metrics: [], feeds: "Condición corporal", icon: Scale },
  { id: "milk", name: "Medidor de leche", vendor: "DeLaval · GEA", desc: "Producción por ordeño y conductividad (mastitis).", metrics: ["intake_kg"], icon: Milk },
  { id: "rfid", name: "Lector RFID / EID", vendor: "ISO 11784/85", desc: "Identifica animales por arete electrónico al pasar.", metrics: [], feeds: "Identificación (tag_id)", icon: ScanLine },
  { id: "water", name: "Bebedero inteligente", vendor: "Genérico", desc: "Consumo de agua por grupo.", metrics: ["intake_kg"], icon: Droplets },
  // ── Clínico / veterinario ──────────────────────────────────────────────
  { id: "bolus", name: "Bolo ruminal de temperatura y pH", vendor: "smaXtec · Moonsyst", desc: "Cápsula intrarruminal: temperatura corporal interna y pH del rumen, en continuo 24/7.", metrics: ["temperature_c"], feeds: "Temperatura interna · pH ruminal", icon: Thermometer },
  { id: "vetthermo", name: "Termómetro veterinario Bluetooth", vendor: "Genérico BT", desc: "Cada temperatura rectal que toma el veterinario se sincroniza al expediente del animal.", metrics: ["temperature_c"], icon: Stethoscope },
  { id: "thermal", name: "Cámara termográfica (IR)", vendor: "FLIR · Genérico", desc: "Imagen térmica para fiebre, inflamación de ubre o pezuña — sin contacto.", metrics: [], feeds: "Temperatura superficial · fiebre", icon: Camera },
  { id: "scc", name: "Analizador de leche (SCC)", vendor: "DeLaval · Afimilk", desc: "Conteo de células somáticas y conductividad por ordeño — mastitis subclínica.", metrics: [], feeds: "Mastitis (SCC / conductividad)", icon: FlaskConical },
  { id: "lameness", name: "Sensor de cojera / podómetro", vendor: "Nedap · IceRobotics", desc: "Pasos y patrón de marcha por animal — cojera temprana antes de que se note.", metrics: ["activity_index"], feeds: "Movilidad · cojera", icon: Footprints },
  { id: "ultrasound", name: "Ultrasonido reproductivo", vendor: "IMV · E.I. Medical", desc: "Diagnóstico de preñez del veterinario, registrado en la ficha reproductiva.", metrics: [], feeds: "Preñez · reproducción", icon: Baby },
  // ── Campo / operación ──────────────────────────────────────────────────
  { id: "gps", name: "Collar / arete GPS", vendor: "Digitanimal · Quantified Ag", desc: "Ubicación de cada animal y geocercas — útil en pastoreo extensivo.", metrics: [], feeds: "Ubicación · geocerca", icon: MapPin },
  { id: "feeder", name: "Comedero / estación de alimentación", vendor: "GEA · Lely", desc: "Consumo individual de alimento y suplemento por visita.", metrics: ["intake_kg"], feeds: "Consumo individual", icon: Wheat },
  { id: "software", name: "Software de manejo", vendor: "DairyComp 305 · Afimilk", desc: "Sincroniza tu hato y registros existentes vía API o CSV — sin recapturar nada.", metrics: [], feeds: "Hato · registros", icon: Database },
];

const DEFAULT_CONNECTED: Record<string, boolean> = { collar: true, weather: true };
const KEY_LS = "hf-apikey";
const CONN_LS = "hf-integrations";

function genKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return "hf_live_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function IntegrationsPage() {
  const { role } = useRole();
  const [apiKey, setApiKey] = useState("");
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://tu-rancho.herdflow.app");
  const [conn, setConn] = useState<Record<string, boolean>>(DEFAULT_CONNECTED);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ status: number; json: unknown } | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    let k = localStorage.getItem(KEY_LS);
    if (!k) { k = genKey(); localStorage.setItem(KEY_LS, k); }
    setApiKey(k);
    const stored = localStorage.getItem(CONN_LS);
    if (stored) { try { setConn({ ...DEFAULT_CONNECTED, ...JSON.parse(stored) }); } catch { /* ignore */ } }
  }, []);

  if (!can(role, "integrations")) return <NoAccess feature="Integraciones" />;

  const toggle = (id: string) => {
    setConn((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(CONN_LS, JSON.stringify(next));
      return next;
    });
  };
  const regenerate = () => { const k = genKey(); setApiKey(k); localStorage.setItem(KEY_LS, k); setReveal(true); };
  const copy = () => { navigator.clipboard?.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const masked = apiKey ? apiKey.slice(0, 8) + "•".repeat(24) : "";

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, readings: [{ tag_id: "ES100078", recorded_at: new Date().toISOString(), metric: "temperature_c", value: 38.6 }] }),
      });
      setResult({ status: res.status, json: await res.json().catch(() => ({})) });
    } catch (e) {
      setResult({ status: 0, json: { error: String(e) } });
    }
    setTesting(false);
  }

  const connectedCount = CATALOG.filter((d) => conn[d.id]).length;
  const curl = `curl -X POST ${origin}/api/v1/readings \\\n  -H "content-type: application/json" \\\n  -d '{"api_key":"${reveal ? apiKey : "hf_live_…"}","readings":[\n    {"tag_id":"ES100078","recorded_at":"${new Date().toISOString()}","metric":"temperature_c","value":38.6}\n  ]}'`;

  return (
    <section className="animate-fade">
      <div className="mb-[22px]">
        <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
          <Cable size={24} strokeWidth={2} color="var(--sage-deep)" /> Integraciones
        </h2>
        <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
          {connectedCount} conectadas · alimenta el hato con lecturas reales de sensores
        </div>
      </div>

      {/* Ingest API */}
      <div className="bg-white border rounded-xl2 p-[22px] mb-[18px]" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <KeyRound size={16} strokeWidth={2} color="var(--sage-deep)" />
          <h3 className="font-sora text-base font-semibold">API de ingesta</h3>
        </div>
        <p className="text-[13px] mb-4" style={{ color: "var(--muted)" }}>
          Cualquier dispositivo o adaptador de proveedor envía lecturas a un único endpoint, autenticado con la API key del rancho.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px] items-center">
          <span className="uppercase text-[11px] tracking-wide" style={{ color: "var(--faint)" }}>Endpoint</span>
          <code className="font-mono text-[12.5px] px-3 py-2 rounded-lg" style={{ background: "var(--card-soft)", color: "var(--ink)" }}>
            POST {origin}/api/v1/readings
          </code>

          <span className="uppercase text-[11px] tracking-wide" style={{ color: "var(--faint)" }}>API key</span>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-[12.5px] px-3 py-2 rounded-lg flex-1 min-w-[200px] overflow-x-auto" style={{ background: "var(--card-soft)", color: "var(--ink)" }}>
              {reveal ? apiKey : masked}
            </code>
            <IconBtn onClick={() => setReveal((r) => !r)} title={reveal ? "Ocultar" : "Mostrar"}>{reveal ? <EyeOff size={15} /> : <Eye size={15} />}</IconBtn>
            <IconBtn onClick={copy} title="Copiar">{copied ? <Check size={15} color="var(--healthy)" /> : <Copy size={15} />}</IconBtn>
            <IconBtn onClick={regenerate} title="Regenerar">{<RefreshCw size={15} />}</IconBtn>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--faint)" }}>
            <Terminal size={13} strokeWidth={2} /> Ejemplo
          </div>
          <pre className="font-mono text-[11.5px] leading-relaxed p-3.5 rounded-xl overflow-x-auto" style={{ background: "#22291f", color: "#dfe7d6" }}>{curl}</pre>
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-4">
          <button onClick={test} disabled={testing} className="text-white border-0 rounded-xl px-4 py-2.5 text-[13px] font-medium cursor-pointer disabled:opacity-60" style={{ background: "var(--sage-deep)" }}>
            {testing ? "Probando…" : "Probar endpoint"}
          </button>
          {result && (
            <span className="text-[12.5px] font-mono px-2.5 py-1.5 rounded-lg" style={{ background: "var(--card-soft)", color: result.status >= 200 && result.status < 300 ? "var(--healthy)" : "var(--brown)" }}>
              {result.status || "ERR"} · {JSON.stringify(result.json)}
            </span>
          )}
        </div>

        <div className="text-[12px] mt-3 pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--faint)" }}>
          Métricas aceptadas: {(["temperature_c", "activity_index", "rumination_min", "intake_kg", "heart_rate", "respiration_rate"] as MetricKey[]).map((m) => METRIC_LABEL[m]).join(" · ")}.
          La ingesta requiere base de datos (modo demo responde <code>503</code>).
        </div>
      </div>

      {/* Device catalog */}
      <h3 className="font-sora text-[17px] font-semibold mb-3.5">Dispositivos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {CATALOG.map((d) => {
          const Icon = d.icon;
          const on = !!conn[d.id];
          return (
            <div key={d.id} className="bg-white border rounded-[16px] p-4 flex gap-3.5" style={{ borderColor: on ? "var(--sage)" : "var(--border)" }}>
              <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0" style={{ background: on ? "var(--sage-deep)" : "var(--card-soft)" }}>
                <Icon size={20} strokeWidth={2} color={on ? "#fff" : "var(--sage-deep)"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[14.5px]">{d.name}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--faint)" }}>{d.vendor}</div>
                  </div>
                  <button
                    onClick={() => toggle(d.id)}
                    className="shrink-0 rounded-[20px] px-3 py-1.5 text-[12px] font-medium cursor-pointer border"
                    style={on ? { background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--muted)" } : { background: "var(--sage-deep)", borderColor: "var(--sage-deep)", color: "#fff" }}
                  >
                    {on ? "Desconectar" : "Conectar"}
                  </button>
                </div>
                <div className="text-[12.5px] mt-1.5 leading-snug" style={{ color: "var(--muted)" }}>{d.desc}</div>
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {on && <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-[2px] rounded-[20px] text-white" style={{ background: "var(--sage-deep)" }}><Check size={10} strokeWidth={3} /> Conectado · sync hace 2 min</span>}
                  {(d.metrics.length ? d.metrics.map((m) => METRIC_LABEL[m]) : [d.feeds!]).map((t) => (
                    <span key={t} className="text-[10.5px] px-2 py-[2px] rounded-[20px]" style={{ background: "var(--brown-soft)", color: "var(--brown)" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer" style={{ borderColor: "var(--border)", background: "#fff", color: "var(--sage-deep)" }}>
      {children}
    </button>
  );
}
