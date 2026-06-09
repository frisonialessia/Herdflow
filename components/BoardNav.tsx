"use client";

// Secondary navigation for the operational boards — one consistent strip across
// every dashboard page, each board showing its live count and highlighting when
// active. Replaces the pile of entry chips that had accreted on the overview
// header, and keeps the (full) top-nav pill untouched. Horizontally scrollable
// on narrow screens. All counts are deterministic, so it's hydration-safe.

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHerd } from "@/components/HerdProvider";
import { summarizeRepro } from "@/lib/repro";
import { summarizeCalving } from "@/lib/calving";
import { summarizeMobility } from "@/lib/mobility";
import { summarizeNutrition } from "@/lib/nutrition";
import { Sun, ClipboardList, HeartPulse, Baby, Footprints, Wheat, LucideIcon } from "lucide-react";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  color: string;
}

export function BoardNav() {
  const path = usePathname();
  const { herd, caseFor, cases, bred } = useHerd();

  const items: Item[] = useMemo(() => {
    const openCases = herd.filter((a) => a.status !== "healthy" && caseFor(a.id).status !== "resolved").length;
    const inHeat = summarizeRepro(herd, bred).counts.inHeat;
    const calving = summarizeCalving(herd).watch.length;
    const lame = summarizeMobility(herd).lame.length;
    const offFeed = summarizeNutrition(herd).offFeed.filter((x) => x.n.status === "off_feed").length;
    return [
      { href: "/dashboard/today", label: "Hoy", icon: Sun, color: "var(--sage-deep)" },
      { href: "/dashboard/cases", label: "Casos", icon: ClipboardList, count: openCases, color: "var(--brown)" },
      { href: "/dashboard/breeding", label: "Reproducción", icon: HeartPulse, count: inHeat, color: "var(--sage-deep)" },
      { href: "/dashboard/calving", label: "Partos", icon: Baby, count: calving, color: "var(--brown)" },
      { href: "/dashboard/mobility", label: "Movilidad", icon: Footprints, count: lame, color: "var(--brown)" },
      { href: "/dashboard/nutrition", label: "Nutrición", icon: Wheat, count: offFeed, color: "var(--brown)" },
    ];
  }, [herd, cases, bred]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
      {items.map((it) => {
        const Icon = it.icon;
        const active = it.href === "/dashboard/today" ? path === "/dashboard/today" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-2 rounded-[30px] px-3.5 py-2 text-[13px] border whitespace-nowrap shrink-0 transition-all duration-200 hover:-translate-y-[1px]"
            style={active ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" } : { background: "var(--card)", borderColor: "var(--border)", color: "var(--ink)" }}
          >
            <Icon size={15} strokeWidth={2} color={active ? "#fff" : "var(--sage-deep)"} />
            {it.label}
            {it.count !== undefined && it.count > 0 && (
              <span className="rounded-[20px] px-1.5 text-[11px] font-semibold text-white" style={{ background: active ? "rgba(255,255,255,0.25)" : it.color }}>
                {it.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
