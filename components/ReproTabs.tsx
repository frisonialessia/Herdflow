"use client";

// Sub-navigation for the two halves of the reproduction area: heat/breeding and
// calving. Kept off the main top-nav pill (which is full) — this is the local
// switcher between the paired boards.

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/breeding", label: "Heat & breeding" },
  { href: "/dashboard/calving", label: "Calving" },
];

export function ReproTabs() {
  const path = usePathname();
  return (
    <div className="flex gap-2 mb-5">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-xl px-3.5 py-2 text-[13px] border transition-colors"
            style={active ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" } : { background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
