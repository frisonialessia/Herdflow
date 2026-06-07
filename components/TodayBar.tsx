"use client";

// Slim entry into the Today action center, shown at the top of the overview.
// Summarizes the herd-wide worklist (full herd, regardless of the page's group
// filter) and links into the full board.

import { useMemo } from "react";
import Link from "next/link";
import { useHerd } from "@/components/HerdProvider";
import { buildToday } from "@/lib/today";
import { Sun, ChevronRight } from "lucide-react";

export function TodayBar() {
  const { herd, caseFor, cases, bred } = useHerd();
  const board = useMemo(() => buildToday({ herd, caseFor, bred, now: new Date() }), [herd, cases, bred]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Link
      href="/dashboard/today"
      className="flex items-center justify-between gap-3 rounded-[16px] border px-4 py-3 mb-[18px] bg-white hover:shadow-md transition-shadow"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "var(--sage-deep)" }}>
          <Sun size={18} color="#fff" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="font-sora text-[14px] font-semibold">Today</div>
          <div className="text-[12.5px] truncate" style={{ color: "var(--muted)" }}>
            {board.counts.total === 0 ? (
              "All clear — nothing needs attention"
            ) : (
              <>
                <b style={{ color: "var(--critical)" }}>{board.counts.urgent} urgent</b> · {board.counts.today} today · {board.counts.upcoming} upcoming
              </>
            )}
          </div>
        </div>
      </div>
      <span className="flex items-center gap-1 text-[13px] font-medium shrink-0" style={{ color: "var(--sage-deep)" }}>
        Action center <ChevronRight size={16} strokeWidth={2.2} />
      </span>
    </Link>
  );
}
