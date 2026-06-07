// User-selectable currency. Amounts in the app are illustrative assumptions, so
// each currency also carries a sensible default + slider range for its magnitude
// (a saved early catch is worth ~thousands of pesos but ~hundreds of dollars).

export type CurrencyCode = "MXN" | "USD" | "EUR" | "GBP" | "CAD" | "BRL";

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string;
  locale: string;
  perCatch: { def: number; min: number; max: number; step: number };
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  MXN: { code: "MXN", label: "Peso mexicano (MXN)", locale: "es-MX", perCatch: { def: 3000, min: 500, max: 20000, step: 500 } },
  USD: { code: "USD", label: "US Dollar (USD)", locale: "en-US", perCatch: { def: 150, min: 50, max: 1000, step: 10 } },
  EUR: { code: "EUR", label: "Euro (EUR)", locale: "es-ES", perCatch: { def: 150, min: 50, max: 1000, step: 10 } },
  GBP: { code: "GBP", label: "British Pound (GBP)", locale: "en-GB", perCatch: { def: 130, min: 50, max: 900, step: 10 } },
  CAD: { code: "CAD", label: "Canadian Dollar (CAD)", locale: "en-CA", perCatch: { def: 200, min: 50, max: 1300, step: 10 } },
  BRL: { code: "BRL", label: "Real brasileño (BRL)", locale: "pt-BR", perCatch: { def: 800, min: 100, max: 5000, step: 100 } },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(v: string | null): v is CurrencyCode {
  return !!v && v in CURRENCIES;
}

export function formatCurrency(amount: number, code: CurrencyCode): string {
  const { locale } = CURRENCIES[code];
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${code}`;
  }
}
