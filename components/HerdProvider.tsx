"use client";

// Shared, client-side herd state. One living herd is generated once (seeded, so
// it's identical on server and client — no hydration mismatch) and shared across
// every page through context, together with:
//   - the currently-selected animal (detail drawer),
//   - a "live telemetry" interval that appends new readings every few seconds,
//   - a "simulate anomaly" action that flips a healthy animal to critical.
// Simulated animals are frozen (excluded from the tick) so they stay clearly
// flagged for the duration of the demo.

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animal, MetricKey } from "@/lib/types";
import { generateHerd } from "@/lib/mock_data_generator";
import { injectAnomaly, appendTick } from "@/lib/herd_sim";

interface HerdContextValue {
  herd: Animal[];
  selectedId: string | null;
  selected: Animal | null;
  selectAnimal: (id: string | null) => void;
  live: boolean;
  setLive: (v: boolean) => void;
  simulate: (id: string, metric?: MetricKey) => void;
  reset: () => void;
}

const HerdContext = createContext<HerdContextValue | null>(null);

export function HerdProvider({ children }: { children: React.ReactNode }) {
  const [herd, setHerd] = useState<Animal[]>(() => generateHerd());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const simulatedRef = useRef<Set<string>>(new Set());

  const selected = selectedId ? herd.find((a) => a.id === selectedId) ?? null : null;

  function simulate(id: string, metric?: MetricKey) {
    simulatedRef.current.add(id);
    setHerd((prev) => prev.map((a) => (a.id === id ? injectAnomaly(a, metric) : a)));
  }

  function reset() {
    simulatedRef.current = new Set();
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
      value={{ herd, selectedId, selected, selectAnimal: setSelectedId, live, setLive, simulate, reset }}
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
