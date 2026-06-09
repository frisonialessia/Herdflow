"use client";

// Landing waitlist capture — the "what next" the funnel was missing. Demo: it
// validates and thanks you client-side (no backend yet); when the DB is wired,
// this posts to a real /api/waitlist. Honest and zero-friction.

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  if (done) {
    return (
      <div className="flex items-center gap-2 justify-center text-[14px] font-medium" style={{ color: "var(--sage-deep)" }}>
        <Check size={18} strokeWidth={2.4} /> ¡Gracias! Te avisamos en cuanto esté listo para tu rancho.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (ok) setDone(true); }}
      className="flex gap-2 flex-wrap justify-center max-w-[460px] mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu-correo@rancho.mx"
        aria-label="Correo electrónico"
        className="flex-1 min-w-[220px] rounded-[30px] px-5 py-3 text-sm border bg-white outline-none"
        style={{ borderColor: "var(--border)", color: "var(--ink)" }}
      />
      <button
        type="submit"
        disabled={!ok}
        className="text-white rounded-[30px] px-6 py-3 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        style={{ background: "var(--sage-deep)" }}
      >
        Avísame <ArrowRight size={16} strokeWidth={2} />
      </button>
    </form>
  );
}
