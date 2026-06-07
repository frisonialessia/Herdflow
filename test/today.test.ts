import { describe, it, expect } from "vitest";
import { buildToday } from "@/lib/today";
import { generateHerd } from "@/lib/mock_data_generator";
import type { CaseState } from "@/lib/types";

const herd = generateHerd(40, 99);
const NOW = new Date(2026, 5, 15, 9, 0, 0);
const openCase = (): CaseState => ({ status: "open", assignee: null, events: [] });
const resolvedCase = (): CaseState => ({ status: "resolved", assignee: null, events: [] });

describe("buildToday", () => {
  it("tier counts and domain counts both reconcile with the total", () => {
    const board = buildToday({ herd, caseFor: openCase, bred: {}, now: NOW });
    const tierSum = board.byTier.urgent.length + board.byTier.today.length + board.byTier.upcoming.length;
    expect(board.counts.total).toBe(tierSum);
    const domainSum = Object.values(board.byDomain).reduce((a, b) => a + b, 0);
    expect(domainSum).toBe(board.counts.total);
  });

  it("ranks items high-to-low within each tier", () => {
    const board = buildToday({ herd, caseFor: openCase, bred: {}, now: NOW });
    for (const tier of ["urgent", "today", "upcoming"] as const) {
      const ranks = board.byTier[tier].map((i) => i.rank);
      const sorted = [...ranks].sort((a, b) => b - a);
      expect(ranks).toEqual(sorted);
    }
  });

  it("is deterministic for the same inputs", () => {
    const a = buildToday({ herd, caseFor: openCase, bred: {}, now: NOW });
    const b = buildToday({ herd, caseFor: openCase, bred: {}, now: NOW });
    expect(a.byTier.urgent.map((i) => i.id)).toEqual(b.byTier.urgent.map((i) => i.id));
    expect(a.counts).toEqual(b.counts);
  });

  it("resolving every case removes the health worklist items", () => {
    const open = buildToday({ herd, caseFor: openCase, bred: {}, now: NOW });
    const resolved = buildToday({ herd, caseFor: resolvedCase, bred: {}, now: NOW });
    expect(resolved.byDomain.health).toBe(0);
    expect(resolved.counts.total).toBeLessThan(open.counts.total);
  });
});
