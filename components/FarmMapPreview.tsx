// Marketing farm-map for the landing: the same pasture language as the dashboard
// PastureMap, but lightweight (no animal series) and clickable — the whole map
// links into the live dashboard. Deterministic pins so it renders identically.

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pin = { x: number; y: number; status: "healthy" | "watch" | "critical" };

const r = rng(7);
const PINS: Pin[] = Array.from({ length: 24 }, (_, i) => ({
  x: 8 + r() * 84,
  y: 12 + r() * 76,
  status: i === 3 ? "critical" : i === 11 ? "watch" : "healthy",
}));

const healthy = PINS.filter((p) => p.status === "healthy").length;
const watch = PINS.filter((p) => p.status === "watch").length;
const critical = PINS.filter((p) => p.status === "critical").length;
const index = Math.round((healthy / PINS.length) * 100);

export function FarmMapPreview() {
  return (
    <Link
      href="/dashboard"
      className="block relative rounded-xl2 overflow-hidden group"
      style={{ background: "#7c9163", minHeight: 360, boxShadow: "0 30px 60px -30px rgba(58,90,64,0.4)" }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 440" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="lfield" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <rect width="22" height="22" fill="#7c9163" />
            <line x1="0" y1="0" x2="0" y2="22" stroke="#728758" strokeWidth="6" />
          </pattern>
          <pattern id="lfield2" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
            <rect width="18" height="18" fill="#869a6b" />
            <line x1="0" y1="0" x2="0" y2="18" stroke="#7d9162" strokeWidth="5" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="600" height="440" fill="#7c9163" />
        <polygon points="0,0 340,0 300,210 0,250" fill="url(#lfield)" />
        <polygon points="340,0 600,0 600,200 300,210" fill="#8a9e70" />
        <polygon points="0,250 300,210 330,440 0,440" fill="url(#lfield2)" />
        <polygon points="300,210 600,200 600,440 330,440" fill="#74895a" />
        <path d="M-10,260 C150,230 260,250 320,200 C400,140 520,160 620,120" fill="none" stroke="#b39b76" strokeWidth="9" opacity="0.55" />
        <ellipse cx="455" cy="320" rx="46" ry="30" fill="#5e7d86" opacity="0.85" />
        <circle cx="120" cy="120" r="13" fill="#46603a" />
        <circle cx="520" cy="80" r="12" fill="#46603a" />
        <circle cx="80" cy="360" r="11" fill="#46603a" />
        {PINS.map((p, i) => {
          const cx = (p.x / 100) * 600;
          const cy = (p.y / 100) * 440;
          const color = p.status === "critical" ? "#8a4f32" : p.status === "watch" ? "#9a9a5e" : "#588157";
          const rad = p.status === "critical" ? 6.5 : 5;
          return (
            <circle key={i} cx={cx} cy={cy} r={rad} fill={color} stroke="#fff" strokeWidth="1.5">
              {p.status === "critical" && (
                <animate attributeName="r" values={`${rad};${rad + 2.5};${rad}`} dur="2s" repeatCount="indefinite" />
              )}
            </circle>
          );
        })}
      </svg>

      <div
        className="absolute bottom-5 left-5 rounded-[18px] px-5 py-4"
        style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
      >
        <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Herd Health Index</div>
        <div className="font-sora text-[30px] font-semibold mt-1">{index}%</div>
        <div className="flex gap-3.5 mt-3 text-[13px]" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: "#588157" }} /> Healthy {healthy}</span>
          <span className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: "#9a9a5e" }} /> Watch {watch}</span>
          <span className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: "#8a4f32" }} /> Critical {critical}</span>
        </div>
      </div>

      <div
        className="absolute top-5 right-5 flex items-center gap-1.5 text-white text-[13px] font-medium rounded-[30px] px-4 py-2 transition-transform group-hover:translate-x-0.5"
        style={{ background: "rgba(58,90,64,0.92)" }}
      >
        Explore the live map <ArrowUpRight size={15} strokeWidth={2} />
      </div>
    </Link>
  );
}
