"use client";

import { useHerd } from "@/components/HerdProvider";
import { herdSummary } from "@/lib/mock_data_generator";
import { Species } from "@/lib/types";
import { Download, BarChart3, PieChart } from "lucide-react";

export default function ReportsPage() {
  const { herd } = useHerd();
  const s = herdSummary(herd);

  // health % per species
  const groups: { sp: Species; label: string }[] = [
    { sp: "dairy", label: "Dairy Cows" },
    { sp: "beef", label: "Beef" },
    { sp: "sheep", label: "Sheep" },
    { sp: "horse", label: "Horses" },
    { sp: "poultry", label: "Poultry" },
  ];
  const groupHealth = groups
    .map((g) => {
      const members = herd.filter((a) => a.species === g.sp);
      const healthy = members.filter((a) => a.status === "healthy").length;
      const pct = members.length ? Math.round((healthy / members.length) * 100) : 100;
      return { ...g, pct, n: members.length };
    })
    .filter((g) => g.n > 0);

  const weeks = [
    { w: "W1", n: 4 }, { w: "W2", n: 6 }, { w: "W3", n: 5 },
    { w: "W4", n: 8 }, { w: "W5", n: 10 }, { w: "W6", n: 7 },
  ];
  const maxN = Math.max(...weeks.map((x) => x.n));

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight">Reports</h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>Herd health summary · last 30 days</div>
        </div>
        <button className="text-white border-0 rounded-xl px-[18px] py-[11px] text-[13.5px] font-medium cursor-pointer flex gap-2 items-center"
                style={{ background: "var(--sage-deep)" }}>
          <Download size={15} strokeWidth={2} color="#fff" /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi k="Avg Health Index" v={`${s.index}%`} d="↑ 2.1% vs last month" />
        <Kpi k="Anomalies Detected" v="37" d="↑ 9 vs last month" down ill />
        <Kpi k="Early Catches" v="31" d="84% before visible signs" ill />
        <Kpi k="Avg Lead Time" v="2.3d" d="before symptom onset" ill />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[18px] mt-[18px]">
        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <PanelHead title="Anomalies per Week" icon={<BarChart3 size={18} strokeWidth={2} color="var(--sage-deep)" />} />
          <div className="flex items-end gap-3.5 h-[200px] pt-2.5">
            {weeks.map((x) => (
              <div key={x.w} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-xs font-semibold" style={{ color: "var(--sage-deep)" }}>{x.n}</div>
                <div className="w-full max-w-[42px] rounded-t-lg" style={{ height: `${(x.n / maxN) * 100}%`, background: "var(--sage)" }} />
                <div className="text-xs" style={{ color: "var(--muted)" }}>{x.w}</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] mt-3" style={{ color: "var(--faint)" }}>Illustrative sample data.</div>
        </div>

        <div className="bg-white border rounded-xl2 p-[22px]" style={{ borderColor: "var(--border)" }}>
          <PanelHead title="Health by Group" icon={<PieChart size={18} strokeWidth={2} color="var(--sage-deep)" />} />
          <div className="flex flex-col gap-3.5">
            {groupHealth.map((g) => (
              <div key={g.sp}>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span>{g.label}</span><span style={{ color: "var(--muted)" }}>{g.pct}%</span>
                </div>
                <div className="h-[9px] rounded-[20px] overflow-hidden" style={{ background: "var(--card-soft)" }}>
                  <div className="h-full rounded-[20px]" style={{ width: `${g.pct}%`, background: g.pct >= 90 ? "var(--healthy)" : "var(--olive)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({ k, v, d, down, ill }: { k: string; v: string; d: string; down?: boolean; ill?: boolean }) {
  return (
    <div className="bg-white border rounded-[18px] p-5" style={{ borderColor: "var(--border)" }}>
      <div className="text-xs uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--faint)" }}>
        {k}
        {ill && (
          <span className="normal-case text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--card-soft)", color: "var(--faint)" }}
                title="Illustrative — not computed from the demo data">illustrative</span>
        )}
      </div>
      <div className="font-sora text-[28px] font-semibold mt-2">{v}</div>
      <div className="text-[12.5px] mt-1.5" style={{ color: down ? "var(--critical)" : "var(--sage)" }}>{d}</div>
    </div>
  );
}

function PanelHead({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-[18px]">
      <h3 className="font-sora text-base font-semibold">{title}</h3>
      <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center" style={{ background: "var(--card-soft)" }}>{icon}</div>
    </div>
  );
}
