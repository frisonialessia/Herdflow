import { describe, it, expect } from "vitest";
import { roleBriefing, herdFeedCost } from "@/lib/role_home";
import { generateHerd } from "@/lib/mock_data_generator";
import { ROLE_ORDER } from "@/lib/roles";
import type { CaseState } from "@/lib/types";

const herd = generateHerd(40, 99);
const NOW = new Date(2026, 5, 15, 9, 0, 0);
const caseFor = (): CaseState => ({ status: "open", assignee: null, events: [] });
const money = (n: number) => `MX$${n}`;

describe("roleBriefing", () => {
  it("gives every role a complete, non-empty briefing", () => {
    for (const role of ROLE_ORDER) {
      const b = roleBriefing(role, herd, caseFor, {}, NOW, money);
      expect(b.title).toBeTruthy();
      expect(b.subtitle).toBeTruthy();
      expect(b.tiles.length).toBeGreaterThan(0);
      expect(b.actions.length).toBeGreaterThan(0);
    }
  });

  it("points each role at the destination that matters to them", () => {
    const hrefs = (role: Parameters<typeof roleBriefing>[0]) => roleBriefing(role, herd, caseFor, {}, NOW, money).actions.map((a) => a.href);
    expect(hrefs("vet")).toContain("/dashboard/cases");
    expect(hrefs("herdsman")).toContain("/dashboard/today");
    expect(hrefs("manager")).toContain("/dashboard/impact");
    expect(hrefs("owner")).toContain("/dashboard/settings");
  });

  it("formats money tiles through the supplied formatter", () => {
    const b = roleBriefing("manager", herd, caseFor, {}, NOW, money);
    const cost = b.tiles.find((t) => t.label === "Costo alim./día");
    expect(cost?.value).toBe(money(herdFeedCost(herd)));
  });
});

describe("herdFeedCost", () => {
  it("sums to a positive daily cost for a real herd", () => {
    expect(herdFeedCost(herd)).toBeGreaterThan(0);
    expect(herdFeedCost([])).toBe(0);
  });
});
