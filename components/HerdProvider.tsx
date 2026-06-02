"use client";

// Shared, client-side herd state. One living herd is generated once (seeded, so
// it's identical on server and client — no hydration mismatch) and shared across
// every page through context. Later layers add mutations (simulate anomaly,
// live tick, add/reset) here so changes ripple to all pages at once.

import { createContext, useContext, useState } from "react";
import { Animal } from "@/lib/types";
import { generateHerd } from "@/lib/mock_data_generator";

interface HerdContextValue {
  herd: Animal[];
}

const HerdContext = createContext<HerdContextValue | null>(null);

export function HerdProvider({ children }: { children: React.ReactNode }) {
  const [herd] = useState<Animal[]>(() => generateHerd());
  return <HerdContext.Provider value={{ herd }}>{children}</HerdContext.Provider>;
}

export function useHerd() {
  const ctx = useContext(HerdContext);
  if (!ctx) throw new Error("useHerd must be used within <HerdProvider>");
  return ctx;
}
