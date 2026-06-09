"use client";

// The role-tailored welcome at the top of the overview: the same herd framed for
// whoever is signed in (vet → clinic, cuidador → the day, gerente → numbers,
// dueño → everything). Reads the briefing from lib/role_home and renders it with
// the role's accent colour + quick links to where that role works.

import Link from "next/link";
import { useHerd } from "@/components/HerdProvider";
import { useRole } from "@/components/RoleProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { ROLE_ICON } from "@/components/RoleSwitcher";
import { ROLE_LABEL, ROLE_COLOR } from "@/lib/roles";
import { roleBriefing } from "@/lib/role_home";

export function RoleHome() {
  const { role } = useRole();
  const { herd, caseFor, bred } = useHerd();
  const { format } = useCurrency();

  const b = roleBriefing(role, herd, caseFor, bred, new Date(), format);
  const accent = ROLE_COLOR[role];
  const Icon = ROLE_ICON[role];

  return (
    <div className="bg-white border rounded-xl2 p-5 mb-[18px]" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: accent }}>
            <Icon size={20} strokeWidth={2.2} color="#fff" />
          </div>
          <div>
            <div className="font-sora text-[18px] font-semibold leading-tight">{b.title}</div>
            <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{b.subtitle} · <span style={{ color: accent, fontWeight: 600 }}>{ROLE_LABEL[role]}</span></div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {b.actions.map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-[30px] px-4 py-2 text-[13px] font-medium border whitespace-nowrap"
              style={i === 0 ? { background: accent, color: "#fff", borderColor: accent } : { background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {b.tiles.map((t) => (
          <div key={t.label} className="rounded-[14px] p-3.5 border" style={{ borderColor: t.accent ? accent : "var(--border)", background: t.accent ? "var(--card-soft)" : "#fff" }}>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--faint)" }}>{t.label}</div>
            <div className="font-sora text-[22px] font-semibold mt-0.5" style={{ color: t.accent ? accent : "var(--ink)" }}>{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
