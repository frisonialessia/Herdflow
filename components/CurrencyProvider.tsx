"use client";

// App-wide currency preference (persisted to localStorage so it survives reloads,
// unlike the demo data). Defaults to MXN; loaded on the client after mount to
// avoid any hydration mismatch.

import { createContext, useContext, useEffect, useState } from "react";
import { CurrencyCode, CURRENCIES, CurrencyInfo, formatCurrency, isCurrencyCode } from "@/lib/currency";

interface CurrencyValue {
  code: CurrencyCode;
  info: CurrencyInfo;
  setCode: (c: CurrencyCode) => void;
  format: (amount: number) => string;
}

const Ctx = createContext<CurrencyValue | null>(null);
const KEY = "hf-currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCodeState] = useState<CurrencyCode>("MXN");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (isCurrencyCode(stored)) setCodeState(stored);
  }, []);

  const setCode = (c: CurrencyCode) => {
    setCodeState(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* ignore */
    }
  };

  const value: CurrencyValue = {
    code,
    info: CURRENCIES[code],
    setCode,
    format: (amount: number) => formatCurrency(amount, code),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency must be used within <CurrencyProvider>");
  return ctx;
}
