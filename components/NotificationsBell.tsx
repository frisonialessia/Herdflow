"use client";

// Live alert center in the top bar. Derives alerts straight from the shared
// herd state (any animal not "healthy"), so it works identically in the public
// demo (synthetic herd) and in real mode (herd loaded from Postgres) — both
// produce the same Animal[] with status / deviation / inferred condition.
//
// Unread is tracked per (animal + status), so an animal escalating
// healthy → watch → critical re-notifies. The badge clears only when the user
// opens an alert or hits "Mark all as read" — glancing never silences a critical.

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, Stethoscope } from "lucide-react";
import { useHerd } from "@/components/HerdProvider";
import { inferCondition } from "@/lib/conditions";
import { SPECIES_EMOJI, type Animal } from "@/lib/types";
import { METRIC_LABEL, fmtZ, timeAgo } from "@/lib/format";

const keyOf = (a: Animal) => `${a.id}:${a.status}`;
const SEVERITY_ORDER = { critical: 0, watch: 1, healthy: 2 } as const;

export function NotificationsBell() {
  const { herd, selectAnimal } = useHerd();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const alerts = useMemo(
    () =>
      herd
        .filter((a) => a.status !== "healthy")
        .sort(
          (p, q) =>
            SEVERITY_ORDER[p.status] - SEVERITY_ORDER[q.status] ||
            Math.abs(q.deviation.z_score) - Math.abs(p.deviation.z_score)
        ),
    [herd]
  );

  const unread = alerts.filter((a) => !seen.has(keyOf(a)));
  const criticalCount = alerts.filter((a) => a.status === "critical").length;
  const hasUnreadCritical = unread.some((a) => a.status === "critical");

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = () => setSeen(new Set(alerts.map(keyOf)));
  const openAnimal = (a: Animal) => {
    setSeen((prev) => new Set(prev).add(keyOf(a)));
    selectAnimal(a.id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificaciones${unread.length ? ` (${unread.length} sin leer)` : ""}`}
        className="w-[38px] h-[38px] rounded-full bg-white border flex items-center justify-center cursor-pointer relative"
        style={{ borderColor: "var(--border)" }}
      >
        <Bell size={18} strokeWidth={2} color="var(--sage-deep)" />
        {hasUnreadCritical && (
          <span
            className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full animate-ping"
            style={{ background: "var(--critical)", opacity: 0.45 }}
          />
        )}
        {unread.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
            style={{ background: criticalCount > 0 ? "var(--critical)" : "var(--watch)" }}
          >
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-40 rounded-2xl border bg-white w-[340px] overflow-hidden"
          style={{ borderColor: "var(--border)", boxShadow: "0 24px 48px -18px rgba(58,90,64,0.4)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="font-sora text-[15px] font-semibold">Alertas</div>
            <div className="text-[12px]" style={{ color: "var(--muted)" }}>
              {criticalCount} críticos · {alerts.length - criticalCount} vigilancia
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--card-soft)" }}
                >
                  <Stethoscope size={18} strokeWidth={2} color="var(--healthy)" />
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  Todo en orden — cada animal está dentro de su rango normal.
                </div>
              </div>
            ) : (
              alerts.map((a) => {
                const cond = inferCondition(a);
                const isUnread = !seen.has(keyOf(a));
                const c = a.status === "critical" ? "var(--critical)" : "var(--watch)";
                return (
                  <button
                    key={a.id}
                    onClick={() => openAnimal(a)}
                    className="w-full text-left flex gap-3 items-start px-4 py-3 border-b transition-colors cursor-pointer hover:bg-[var(--card-soft)]"
                    style={{ borderColor: "var(--border)", background: isUnread ? "rgba(138,79,50,0.04)" : "transparent" }}
                  >
                    <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: c }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-[14px] truncate">
                          {SPECIES_EMOJI[a.species]} {a.name}
                        </div>
                        <div className="text-[11px] whitespace-nowrap" style={{ color: "var(--faint)" }}>
                          {timeAgo(a.latest.recorded_at)}
                        </div>
                      </div>
                      <div className="text-[13px] mt-0.5" style={{ color: "var(--ink)" }}>
                        {cond.label}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>
                        {METRIC_LABEL[a.deviation.metric]} · z {fmtZ(a.deviation.z_score)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {alerts.length > 0 && (
            <button
              onClick={markAllRead}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[13px] font-medium cursor-pointer transition-colors hover:bg-[var(--card-soft)]"
              style={{ color: "var(--sage-deep)" }}
            >
              <Check size={15} strokeWidth={2.2} /> Marcar todo como leído
            </button>
          )}
        </div>
      )}
    </div>
  );
}
