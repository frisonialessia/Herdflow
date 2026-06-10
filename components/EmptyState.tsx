// A calm, premium "nothing here — and that's good" state for the operational
// boards. With a healthy herd these show often, so they should read as
// intentional (a green check + a clear line), not like a blank gap. Sits on the
// standard card so it inherits the dashboard's soft depth.

import { Check } from "lucide-react";

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center text-center bg-white border rounded-xl2 py-12 px-6" style={{ borderColor: "var(--border)" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--card-soft)" }}>
        <Check size={22} strokeWidth={2.4} color="var(--healthy)" />
      </div>
      <div className="font-sora text-[15.5px] font-semibold">{title}</div>
      {subtitle && <div className="text-[13px] mt-1.5 max-w-[380px] leading-relaxed" style={{ color: "var(--muted)" }}>{subtitle}</div>}
    </div>
  );
}
