"use client";

// Shared, client-side herd state. One living herd is generated once (seeded, so
// it's identical on server and client — no hydration mismatch) and shared across
// every page through context, together with:
//   - the currently-selected animal (detail drawer),
//   - a "live telemetry" interval that appends new readings every few seconds,
//   - a "simulate anomaly" action that flips a healthy animal to critical,
//   - "add animal" / "reset" demo actions.
// Simulated animals are frozen (excluded from the tick) so they stay clearly
// flagged for the duration of the demo.

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animal, MetricKey, CaseStatus, CaseState, Species, AnimalProfile } from "@/lib/types";
import { generateHerd, generateAnimal } from "@/lib/mock_data_generator";
import { injectAnomaly, appendTick } from "@/lib/herd_sim";
import { LogEntry } from "@/lib/history";
import { createAnimalAction, updateAnimalAction, removeAnimalAction, advanceCaseAction, assignCaseAction, markBredAction } from "@/app/dashboard/actions";

const CASE_EVENT_LABEL: Record<CaseStatus, string> = {
  open: "Reabierto",
  acknowledged: "Reconocido",
  treating: "Tratamiento iniciado",
  resolved: "Resuelto",
};
const EMPTY_CASE: CaseState = { status: "open", assignee: null, events: [] };

// Every animal starts with an enrollment entry, dated to when its monitoring
// began (the first reading), so the history always goes back to platform entry.
function seedEnrollment(herd: Animal[]): Record<string, LogEntry[]> {
  const out: Record<string, LogEntry[]> = {};
  for (const a of herd) {
    const at = a.series[0]?.recorded_at ?? new Date().toISOString();
    out[a.id] = [{ at, kind: "enrolled", title: "Alta en la plataforma", detail: "Monitoreo iniciado" }];
  }
  return out;
}

interface HerdContextValue {
  herd: Animal[];
  selectedId: string | null;
  selected: Animal | null;
  selectAnimal: (id: string | null) => void;
  live: boolean;
  setLive: (v: boolean) => void;
  simulate: (id: string, metric?: MetricKey) => void;
  simulateOutbreak: (metric?: MetricKey) => string[];
  addAnimal: (input?: AnimalInput) => void;
  updateAnimal: (id: string, patch: AnimalPatch) => void;
  removeAnimal: (id: string) => void;
  reset: () => void;
  // Case workflow (operational loop on top of an alert).
  cases: Record<string, CaseState>;
  caseFor: (id: string) => CaseState;
  advanceCase: (id: string, status: CaseStatus) => void;
  assignCase: (id: string, who: string | null) => void;
  // Reproduction: cows the user has marked inseminated this session (id → ISO).
  bred: Record<string, string>;
  markBred: (id: string) => void;
  // Persisted per-animal history log (enrollment, edits, …), kept for the session.
  log: Record<string, LogEntry[]>;
  // True when changes are written to the DB (real mode), false in the demo.
  persisted: boolean;
}

export type AnimalInput = { name?: string; tag_id?: string; species?: Species; profile?: Partial<AnimalProfile> };
export type AnimalPatch = { name?: string; tag_id?: string; profile?: Partial<AnimalProfile> };

const HerdContext = createContext<HerdContextValue | null>(null);

export interface InitialOps {
  cases: Record<string, CaseState>;
  bred: Record<string, string>;
  log: Record<string, LogEntry[]>;
}

export function HerdProvider({
  children,
  initialHerd,
  initialOps,
  persisted = false,
}: {
  children: React.ReactNode;
  initialHerd?: Animal[] | null;
  initialOps?: InitialOps | null;
  persisted?: boolean;
}) {
  // Real data from the server (DB) when provided; synthetic fallback otherwise.
  const [herd, setHerd] = useState<Animal[]>(() => initialHerd ?? generateHerd());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [cases, setCases] = useState<Record<string, CaseState>>(() => initialOps?.cases ?? {});
  const [bred, setBred] = useState<Record<string, string>>(() => initialOps?.bred ?? {});
  const [log, setLog] = useState<Record<string, LogEntry[]>>(() => initialOps?.log ?? seedEnrollment(initialHerd ?? herd));
  const simulatedRef = useRef<Set<string>>(new Set());

  function logEvent(id: string, entry: Omit<LogEntry, "at"> & { at?: string }) {
    setLog((prev) => ({
      ...prev,
      [id]: [...(prev[id] ?? []), { at: entry.at ?? new Date().toISOString(), kind: entry.kind, title: entry.title, detail: entry.detail }],
    }));
  }
  const addedRef = useRef(0);

  const caseFor = (id: string): CaseState => cases[id] ?? EMPTY_CASE;

  function advanceCase(id: string, status: CaseStatus) {
    setCases((prev) => {
      const cur = prev[id] ?? EMPTY_CASE;
      const evt = { at: new Date().toISOString(), label: CASE_EVENT_LABEL[status] };
      return { ...prev, [id]: { ...cur, status, events: [...cur.events, evt] } };
    });
    if (persisted) void advanceCaseAction(id, status).catch((e) => console.error(e));
  }

  function assignCase(id: string, who: string | null) {
    setCases((prev) => {
      const cur = prev[id] ?? EMPTY_CASE;
      // Assigning a still-open case implies you've acknowledged it.
      const status: CaseStatus = who && cur.status === "open" ? "acknowledged" : cur.status;
      const label = who ? `Asignado a ${who}` : "Sin asignar";
      const evt = { at: new Date().toISOString(), label };
      return { ...prev, [id]: { ...cur, assignee: who, status, events: [...cur.events, evt] } };
    });
    if (persisted) void assignCaseAction(id, who).catch((e) => console.error(e));
  }

  function markBred(id: string) {
    setBred((prev) => ({ ...prev, [id]: new Date().toISOString() }));
    if (persisted) void markBredAction(id).catch((e) => console.error(e));
  }

  const selected = selectedId ? herd.find((a) => a.id === selectedId) ?? null : null;

  function simulate(id: string, metric?: MetricKey) {
    simulatedRef.current.add(id);
    setHerd((prev) => prev.map((a) => (a.id === id ? injectAnomaly(a, metric) : a)));
  }

  // Flip a healthy seed animal plus its nearest healthy neighbors on the same
  // metric, so a tight spatial cluster forms and detectOutbreaks lights up a hot
  // zone on the map. Returns the affected ids (so a caller can react if needed).
  function simulateOutbreak(metric: MetricKey = "temperature_c"): string[] {
    const eligible = herd.filter(
      (a) => a.status === "healthy" && (metric !== "rumination_min" || a.baseline.rumination_min > 0)
    );
    if (eligible.length < 3) return [];
    const seed = eligible[Math.floor(Math.random() * eligible.length)];
    const near = eligible
      .filter((a) => a.id !== seed.id)
      .sort((a, b) => Math.hypot(a.x - seed.x, a.y - seed.y) - Math.hypot(b.x - seed.x, b.y - seed.y))
      .slice(0, 3);
    const ids = [seed.id, ...near.map((a) => a.id)];
    ids.forEach((id) => simulatedRef.current.add(id));
    setHerd((prev) => prev.map((a) => (ids.includes(a.id) ? injectAnomaly(a, metric) : a)));
    return ids;
  }

  async function addAnimal(input?: AnimalInput) {
    if (persisted) {
      // Server creates the row (with a starter series) and returns the real
      // record; add it with its DB id so later edits/cases map correctly.
      try {
        const created = await createAnimalAction(input ?? {});
        if (created) {
          setHerd((prev) => [created, ...prev]);
          setSelectedId(created.id);
          logEvent(created.id, { kind: "enrolled", title: "Alta en la plataforma", detail: "Animal agregado al hato" });
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }
    const n = addedRef.current++;
    const a = generateAnimal(herd.length + n, Date.now() + n, { name: input?.name, species: input?.species });
    a.id = `an-new-${n}`;
    if (input?.tag_id) a.tag_id = input.tag_id;
    if (input?.profile && a.profile) a.profile = { ...a.profile, ...input.profile };
    setHerd((prev) => [a, ...prev]);
    setSelectedId(a.id);
    logEvent(a.id, { kind: "enrolled", title: "Alta en la plataforma", detail: "Animal agregado al hato" });
  }

  function updateAnimal(id: string, patch: AnimalPatch) {
    setHerd((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...(patch.name !== undefined ? { name: patch.name } : {}),
              ...(patch.tag_id !== undefined ? { tag_id: patch.tag_id } : {}),
              profile: patch.profile && a.profile ? { ...a.profile, ...patch.profile } : a.profile,
            }
          : a
      )
    );
    logEvent(id, { kind: "edit", title: "Ficha actualizada" });
    if (persisted) void updateAnimalAction(id, patch).catch((e) => console.error(e));
  }

  function removeAnimal(id: string) {
    setHerd((prev) => prev.filter((a) => a.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    if (persisted) void removeAnimalAction(id).catch((e) => console.error(e));
    setCases((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setBred((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setLog((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function reset() {
    simulatedRef.current = new Set();
    addedRef.current = 0;
    setLive(false);
    setSelectedId(null);
    setCases({});
    setBred({});
    const fresh = generateHerd();
    setHerd(fresh);
    setLog(seedEnrollment(fresh));
  }

  // Live telemetry: append a reading to every non-simulated animal on an interval.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setHerd((prev) => prev.map((a) => (simulatedRef.current.has(a.id) ? a : appendTick(a))));
    }, 2500);
    return () => clearInterval(t);
  }, [live]);

  return (
    <HerdContext.Provider
      value={{ herd, selectedId, selected, selectAnimal: setSelectedId, live, setLive, simulate, simulateOutbreak, addAnimal, updateAnimal, removeAnimal, reset, cases, caseFor, advanceCase, assignCase, bred, markBred, log, persisted }}
    >
      {children}
    </HerdContext.Provider>
  );
}

export function useHerd() {
  const ctx = useContext(HerdContext);
  if (!ctx) throw new Error("useHerd must be used within <HerdProvider>");
  return ctx;
}
