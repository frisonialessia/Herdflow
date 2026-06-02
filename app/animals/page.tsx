"use client";

import { useState } from "react";
import { useHerd } from "@/components/HerdProvider";
import { SPECIES_EMOJI, SPECIES_LABEL, Species } from "@/lib/types";
import { STATUS_LABEL, fmtZ, timeAgo } from "@/lib/format";
import { Search, Plus } from "lucide-react";

const FILTERS: { label: string; sp: Species | "all" }[] = [
  { label: "All", sp: "all" },
  { label: "Dairy", sp: "dairy" },
  { label: "Beef", sp: "beef" },
  { label: "Sheep", sp: "sheep" },
  { label: "Horses", sp: "horse" },
  { label: "Poultry", sp: "poultry" },
];

export default function AnimalsPage() {
  const { herd, selectAnimal } = useHerd();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Species | "all">("all");

  const q = query.trim().toLowerCase();
  const shown = herd.filter(
    (a) =>
      (filter === "all" || a.species === filter) &&
      (q === "" || a.name.toLowerCase().includes(q) || a.tag_id.toLowerCase().includes(q))
  );
  const flagged = shown.filter((a) => a.status !== "healthy").length;

  return (
    <section className="animate-fade">
      <div className="flex items-end justify-between mb-[22px] flex-wrap gap-3">
        <div>
          <h2 className="font-sora text-[26px] font-semibold tracking-tight">Animals</h2>
          <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {shown.length} of {herd.length} · {flagged} needing attention
          </div>
        </div>
        <button className="text-white border-0 rounded-[30px] px-5 py-[11px] text-sm font-medium cursor-pointer flex gap-2 items-center"
                style={{ background: "var(--sage-deep)" }}>
          <Plus size={16} strokeWidth={2} color="#fff" /> Add Animal
        </button>
      </div>

      <div className="bg-white border rounded-xl2 p-2 overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between p-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 border rounded-xl px-3.5 py-[9px] min-w-[240px]"
               style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}>
            <Search size={18} strokeWidth={2} color="var(--sage-deep)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
                   placeholder="Search by name or tag..."
                   className="border-0 bg-transparent outline-none text-sm w-full" style={{ color: "var(--ink)" }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => {
              const active = filter === f.sp;
              return (
                <button key={f.label} onClick={() => setFilter(f.sp)}
                        className="rounded-xl px-3.5 py-2 text-[13px] cursor-pointer border"
                        style={active
                          ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" }
                          : { background: "var(--card-soft)", borderColor: "var(--border)" }}>{f.label}</button>
              );
            })}
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Animal", "Group", "Status", "Temp", "Activity", "Z-score", "Last sync"].map((h) => (
                <th key={h} className="text-left text-[11.5px] uppercase tracking-wide font-semibold px-4 py-3 border-b"
                    style={{ color: "var(--faint)", borderColor: "var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => {
              const cls = a.status === "critical" ? "var(--critical)" : a.status === "watch" ? "var(--watch)" : "var(--healthy)";
              return (
                <tr key={a.id} onClick={() => selectAnimal(a.id)} className="cursor-pointer hover:bg-[var(--card-soft)] transition-colors">
                  <td className="px-4 py-3.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px]" style={{ background: "var(--card-soft)" }}>
                        {SPECIES_EMOJI[a.species]}
                      </div>
                      <div>
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-xs" style={{ color: "var(--faint)" }}>{a.tag_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>{SPECIES_LABEL[a.species]}</td>
                  <td className="px-4 py-3.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-[20px] text-white inline-block" style={{ background: cls }}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>{a.latest.temperature_c.toFixed(1)}°C</td>
                  <td className="px-4 py-3.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>{a.latest.activity_index}</td>
                  <td className="px-4 py-3.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                    <span className="font-sora font-semibold" style={{ color: a.status !== "healthy" ? "var(--critical)" : "var(--ink)" }}>
                      {fmtZ(a.deviation.z_score)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>{timeAgo(a.latest.recorded_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {shown.length === 0 && (
          <div className="text-center text-sm py-10" style={{ color: "var(--muted)" }}>
            No animals match your search.
          </div>
        )}
      </div>
    </section>
  );
}
