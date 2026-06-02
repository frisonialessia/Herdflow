"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm({ invalidLink }: { invalidLink?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(invalidLink ? "error" : "idle");
  const [message, setMessage] = useState(
    invalidLink ? "That link expired or was already used. Request a new one." : ""
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("sending");
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("sent");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-white border rounded-xl2 p-8 text-center" style={{ borderColor: "var(--border)" }}>
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--brown-soft)" }}>
          <CheckCircle2 size={26} strokeWidth={2} color="var(--sage-deep)" />
        </div>
        <h2 className="font-sora text-[22px] font-semibold">Check your email</h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          We sent a sign-in link to{" "}
          <span className="font-semibold" style={{ color: "var(--ink)" }}>{email}</span>.
          Open it on this device to continue.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-[13px] mt-5 cursor-pointer bg-transparent border-0"
          style={{ color: "var(--sage-deep)" }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl2 p-8" style={{ borderColor: "var(--border)" }}>
      <h2 className="font-sora text-[24px] font-semibold tracking-tight">Welcome to HerdFlow</h2>
      <p className="text-sm mt-1.5 mb-6" style={{ color: "var(--muted)" }}>
        Enter your email and we&apos;ll send you a secure sign-in link.
      </p>
      <form onSubmit={onSubmit}>
        <label className="text-[12px] uppercase tracking-wide font-semibold" style={{ color: "var(--faint)" }}>
          Email
        </label>
        <div
          className="flex items-center gap-2 border rounded-xl px-3.5 py-3 mt-1.5 mb-4"
          style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}
        >
          <Mail size={18} strokeWidth={2} color="var(--sage-deep)" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@farm.com"
            autoComplete="email"
            className="border-0 bg-transparent outline-none text-sm w-full"
            style={{ color: "var(--ink)" }}
          />
        </div>
        {status === "error" && (
          <div
            className="text-[13px] mb-4 rounded-xl px-3.5 py-2.5"
            style={{ background: "#f3ece3", border: "1px solid var(--brown-soft)", color: "var(--brown)" }}
          >
            {message}
          </div>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full text-white border-0 rounded-[30px] px-5 py-3 text-sm font-medium cursor-pointer flex gap-2 items-center justify-center disabled:opacity-70"
          style={{ background: "var(--sage-deep)" }}
        >
          {status === "sending" ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              Send magic link <ArrowRight size={16} strokeWidth={2} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
