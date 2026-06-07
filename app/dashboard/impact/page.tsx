"use client";

import { useEffect, useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useRole } from "@/components/RoleProvider";
import { can } from "@/lib/roles";
import { NoAccess } from "@/components/NoAccess";
import { herdSummary } from "@/lib/mock_data_generator";
import { Activity, ShieldCheck, Timer, TrendingUp } from "lucide-react";

export default function ImpactPage() {
  const { herd } = useHerd();
  const { code, info, format } = useCurrency();
  const { role } = useRole();
  const s = herdSummary(herd);

  const [catches, setCatches] = useState(Math.max(3, Math.round(herd.length * 0.12)));
  const [perCatch, setPerCatch] = useState(info.perCatch.def);

  // Re-scale the per-catch assumption to the selected currency's magnitude.
  useEffect(() => setPerCatch(info.perCatch.def), [code, info.perCatch.def]);

  const monthly = catches * perCatch;
  const annual = monthly * 12;
  const fmt = (n: number) => format(n);

  if (!can(role, "finance")) return <NoAccess feature="Impact" />;

  return (
    <section className="animate-fade">
      <div className="mb-[22px]">
        <h2 className="font-sora text-[26px] font-semibold tracking-tight">Impact</h2>
        <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>What early detection is worth · illustrative model</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Activity size={16} strokeWidth={2} color="var(--sage-deep)" />} k="Animals monitored" v={`${s.total}`} sub="live, 24/7" />
        <Stat icon={<ShieldCheck size={16} strokeWidth={2} color="var(--sage-deep)" />} k="Herd health" v={`${s.index}%`} sub={`${s.watch + s.critical} need attention`} />
        <Stat icon={<Timer size={16} strokeWidth={2} color="var(--sage-deep)" />} k="Avg lead time" v="2.3d" sub="before symptoms" ill />
        <Stat icon={<TrendingUp size={16} strokeWidth={2} color="var(--sage-deep)" />} k="Early catches / mo" v={`${catches}`} sub="adjust below" ill />
      </div>

      <div className="bg-white border rounded-xl2 p-[22px] mt-[18px]" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-sora text-base font-semibold mb-1">Estimated value of early detection</h3>
        <p className="text-[13px] mb-5" style={{ color: "var(--muted)" }}>Adjust the assumptions — the math is transparent and illustrative.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-6 items-center">
          <Slider label="Early catches / month" value={catches} min={1} max={40} onChange={setCatches} display={`${catches}`} />
          <Slider label={`Saved per early catch (${code})`} value={perCatch} min={info.perCatch.min} max={info.perCatch.max} step={info.perCatch.step} onChange={setPerCatch} display={fmt(perCatch)} />
          <div className="text-center lg:text-right">
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--faint)" }}>Est. annual value</div>
            <div className="font-sora text-[34px] font-semibold" style={{ color: "var(--sage-deep)" }}>{fmt(annual)}</div>
            <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{fmt(monthly)} / month</div>
          </div>
        </div>

        <div className="text-[12px] mt-5 pt-4 border-t" style={{ borderColor: "var(--border)", color: "var(--faint)" }}>
          {catches} catches × {fmt(perCatch)} × 12 months = {fmt(annual)}. Illustrative — not based on real outcome data.
        </div>
      </div>

      <div className="bg-white border rounded-xl2 p-[22px] mt-[18px]" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-[18px]">
          <h3 className="font-sora text-base font-semibold">Where the value comes from</h3>
          <span className="normal-case text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--card-soft)", color: "var(--faint)" }}>illustrative</span>
        </div>
        {[
          { label: "Mortality avoided", pct: 45 },
          { label: "Milk / production loss avoided", pct: 33 },
          { label: "Lower treatment cost", pct: 22 },
        ].map((b) => (
          <div key={b.label} className="mb-3.5 last:mb-0">
            <div className="flex justify-between text-[13px] mb-1.5"><span>{b.label}</span><span style={{ color: "var(--muted)" }}>{b.pct}%</span></div>
            <div className="h-[9px] rounded-[20px] overflow-hidden" style={{ background: "var(--card-soft)" }}>
              <div className="h-full rounded-[20px]" style={{ width: `${b.pct}%`, background: "var(--sage)" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, k, v, sub, ill }: { icon: React.ReactNode; k: string; v: string; sub: string; ill?: boolean }) {
  return (
    <div className="bg-white border rounded-[18px] p-5" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--faint)" }}>
          {k}
          {ill && <span className="normal-case text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--card-soft)" }}>illustrative</span>}
        </div>
        <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center" style={{ background: "var(--card-soft)" }}>{icon}</div>
      </div>
      <div className="font-sora text-[26px] font-semibold mt-2">{v}</div>
      <div className="text-[12.5px] mt-0.5" style={{ color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}

function Slider({
  label, value, min, max, step = 1, onChange, display,
}: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; display: string }) {
  return (
    <div>
      <div className="flex justify-between text-[13px] mb-2">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-semibold">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer" style={{ accentColor: "var(--sage-deep)" }}
      />
    </div>
  );
}
