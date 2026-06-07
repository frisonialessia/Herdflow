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
import { Animal, MetricKey } from "@/lib/types";
import { generateHerd, generateAnimal } from "@/lib/mock_data_generator";
import { injectAnomaly, appendTick } from "@/lib/herd_sim";

interface HerdContextValue {
  herd: Animal[];
  selectedId: string | null;
  selected: Animal | null;
  selectAnimal: (id: string | null) => void;
  live: boolean;
  setLive: (v: boolean) => void;
  simulate: (id: string, metric?: MetricKey) => void;
  simulateOutbreak: (metric?: MetricKey) => string[];
  addAnimal: () => void;
  reset: () => void;
}

const HerdContext = createContext<HerdContextValue | null>(null);

export function HerdProvider({ children, initialHerd }: { children: React.ReactNode; initialHerd?: Animal[] | null }) {
  // Real data from the server (DB) when provided; synthetic fallback otherwise.
  const [herd, setHerd] = useState<Animal[]>(() => initialHerd ?? generateHerd());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const simulatedRef = useRef<Set<string>>(new Set());
  const addedRef = useRef(0);

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

  function addAnimal() {
    const n = addedRef.current++;
    const a = generateAnimal(herd.length + n, Date.now() + n);
    a.id = `an-new-${n}`;
    setHerd((prev) => [a, ...prev]);
    setSelectedId(a.id);
  }

  function reset() {
    simulatedRef.current = new Set();
    addedRef.current = 0;
    setLive(false);
    setSelectedId(null);
    setHerd(generateHerd());
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
      value={{ herd, selectedId, selected, selectAnimal: setSelectedId, live, setLive, simulate, simulateOutbreak, addAnimal, reset }}
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
