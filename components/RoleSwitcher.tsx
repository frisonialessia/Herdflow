"use client";

// Role pill. In demo mode it's a dropdown to preview each role; when locked
// (real mode) it's a static badge showing the user's actual role.

import { useState } from "react";
import { useRole } from "@/components/RoleProvider";
import { Role, ROLE_ORDER, ROLE_LABEL, ROLE_DESC, ROLE_COLOR } from "@/lib/roles";
import { Crown, Briefcase, Tractor, Stethoscope, Eye, Check, ChevronDown, LucideIcon } from "lucide-react";

export const ROLE_ICON: Record<Role, LucideIcon> = {
  owner: Crown,
  manager: Briefcase,
  herdsman: Tractor,
  vet: Stethoscope,
  viewer: Eye,
};

export function RoleSwitcher() {
  const { role, setRole, locked } = useRole();
  const [open, setOpen] = useState(false);
  const Icon = ROLE_ICON[role];

  if (locked) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border px-3 py-[7px] text-[12.5px] font-medium bg-white" style={{ borderColor: "var(--border)", color: ROLE_COLOR[role] }}>
        <Icon size={14} strokeWidth={2.2} /> {ROLE_LABEL[role]}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Cambiar rol"
        className="flex items-center gap-1.5 rounded-full border px-3 py-[7px] text-[12.5px] font-medium cursor-pointer bg-white"
        style={{ borderColor: "var(--border)", color: ROLE_COLOR[role] }}
      >
        <Icon size={14} strokeWidth={2.2} /> {ROLE_LABEL[role]} <ChevronDown size={13} strokeWidth={2.2} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-30 rounded-2xl border bg-white p-2 min-w-[248px]"
            style={{ borderColor: "var(--border)", boxShadow: "0 20px 40px -16px rgba(58,90,64,0.35)" }}
          >
            <div className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1.5" style={{ color: "var(--faint)" }}>Ver como</div>
            {ROLE_ORDER.map((r) => {
              const RIcon = ROLE_ICON[r];
              const active = r === role;
              return (
                <button
                  key={r}
                  onClick={() => { setRole(r); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer bg-transparent border-0 text-left hover:bg-[var(--card-soft)] transition-colors"
                >
                  <span className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: active ? ROLE_COLOR[r] : "var(--card-soft)" }}>
                    <RIcon size={15} strokeWidth={2.2} color={active ? "#fff" : ROLE_COLOR[r]} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold block" style={{ color: "var(--ink)" }}>{ROLE_LABEL[r]}</span>
                    <span className="text-[11px] block leading-tight" style={{ color: "var(--muted)" }}>{ROLE_DESC[r]}</span>
                  </span>
                  {active && <Check size={15} strokeWidth={2.4} color={ROLE_COLOR[r]} />}
                </button>
              );
            })}
            <div className="text-[10.5px] px-2 pt-1.5 pb-0.5 leading-snug" style={{ color: "var(--faint)" }}>
              Demo: en producción el rol viene de tu usuario.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
