"use client";

import { useHerd } from "@/components/HerdProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { CURRENCY_CODES, CURRENCIES, CurrencyCode } from "@/lib/currency";
import { X, Play, Pause, RotateCcw, Github } from "lucide-react";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { live, setLive, reset } = useHerd();
  const { code, setCode } = useCurrency();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(35,44,34,0.45)" }} onClick={onClose} />
      <div
        className="relative w-full max-w-[400px] bg-white border rounded-xl2 p-6"
        style={{ borderColor: "var(--border)", boxShadow: "0 30px 60px -20px rgba(58,90,64,0.5)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sora text-[18px] font-semibold">Settings</h3>
          <button onClick={onClose} title="Close" className="cursor-pointer bg-transparent border-0 p-0">
            <X size={18} strokeWidth={2} color="var(--muted)" />
          </button>
        </div>

        <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--faint)" }}>Moneda</div>
        <select
          value={code}
          onChange={(e) => setCode(e.target.value as CurrencyCode)}
          className="w-full border rounded-xl px-3.5 py-2.5 mb-4 text-sm cursor-pointer outline-none"
          style={{ background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
        >
          {CURRENCY_CODES.map((c) => (
            <option key={c} value={c}>{CURRENCIES[c].label}</option>
          ))}
        </select>

        <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--faint)" }}>Demo data</div>

        <button
          onClick={() => setLive(!live)}
          className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] cursor-pointer border mb-2.5"
          style={live
            ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" }
            : { background: "var(--card-soft)", borderColor: "var(--border)" }}
        >
          <span className="flex items-center gap-2">
            {live ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
            {live ? "Live telemetry on" : "Start live telemetry"}
          </span>
        </button>

        <button
          onClick={() => { reset(); onClose(); }}
          className="w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] cursor-pointer border"
          style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}
        >
          <RotateCcw size={15} strokeWidth={2} /> Reset demo data
        </button>

        <div className="border-t mt-4 pt-4 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          HerdFlow demo — all data is synthetic.{" "}
          <a
            href="https://github.com/frisonialessia/Herdflow"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium"
            style={{ color: "var(--sage-deep)" }}
          >
            <Github size={13} strokeWidth={2} /> Source
          </a>
        </div>
      </div>
    </div>
  );
}
