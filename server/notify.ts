// Env-gated notification adapter.
//
// $0 BY DEFAULT: with no provider key set it runs in DRY-RUN — it logs exactly
// what it WOULD send and reports success — so the whole alert pipeline works
// offline and free. The day you want real delivery, set RESEND_API_KEY (email)
// and nothing else changes. Swappable for Twilio/WhatsApp behind the same call.

export type AlertMessage = {
  orgId: string;
  animalLabel: string; // tag or name
  metric: string;
  condition: string | null; // inferred (fever/mastitis, off-feed…)
  zScore: number;
  observed: number | null;
  recipients: string[]; // org members' emails
};

export type DispatchResult = {
  provider: "console" | "resend";
  ok: boolean;
  destination: string | null;
  error?: string;
};

function format(msg: AlertMessage): string {
  const z = Math.abs(msg.zScore).toFixed(1);
  const what = msg.condition ?? msg.metric;
  return `HerdFlow · CRITICAL — ${msg.animalLabel}: ${what} (${msg.metric}, z=${z}). Check this animal now.`;
}

export async function dispatch(msg: AlertMessage): Promise<DispatchResult> {
  const text = format(msg);
  const to = msg.recipients[0] ?? null;

  // Real email via Resend — only when configured. Dependency-free (global fetch).
  if (process.env.RESEND_API_KEY && msg.recipients.length > 0) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.ALERTS_FROM || "HerdFlow <alerts@herdflow.app>",
          to: msg.recipients,
          subject: `Critical: ${msg.animalLabel}`,
          text,
        }),
      });
      if (!res.ok) {
        return { provider: "resend", ok: false, destination: to, error: `HTTP ${res.status}` };
      }
      return { provider: "resend", ok: true, destination: to };
    } catch (e) {
      return { provider: "resend", ok: false, destination: to, error: String(e) };
    }
  }

  // $0 default: dry-run. Pipeline fully exercised; nothing sent, nothing charged.
  console.log(`[alerts:dry-run] → ${msg.recipients.join(", ") || "(no recipients)"} :: ${text}`);
  return { provider: "console", ok: true, destination: to };
}
