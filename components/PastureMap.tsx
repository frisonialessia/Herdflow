"use client";

import { useState } from "react";
import { Animal } from "@/lib/types";
import { Plus, Minus, Maximize2 } from "lucide-react";

export function PastureMap({ herd, onSelect }: { herd: Animal[]; onSelect?: (id: string) => void }) {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="relative rounded-xl2 overflow-hidden min-h-[440px]" style={{ background: "#7c9163" }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 600 440"
        preserveAspectRatio="xMidYMid slice"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.25s ease" }}
      >
        <defs>
          <pattern id="field" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <rect width="22" height="22" fill="#7c9163" />
            <line x1="0" y1="0" x2="0" y2="22" stroke="#728758" strokeWidth="6" />
          </pattern>
          <pattern id="field2" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
            <rect width="18" height="18" fill="#869a6b" />
            <line x1="0" y1="0" x2="0" y2="18" stroke="#7d9162" strokeWidth="5" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="600" height="440" fill="#7c9163" />
        <polygon points="0,0 340,0 300,210 0,250" fill="url(#field)" />
        <polygon points="340,0 600,0 600,200 300,210" fill="#8a9e70" />
        <polygon points="0,250 300,210 330,440 0,440" fill="url(#field2)" />
        <polygon points="300,210 600,200 600,440 330,440" fill="#74895a" />
        <path d="M-10,260 C150,230 260,250 320,200 C400,140 520,160 620,120" fill="none" stroke="#b39b76" strokeWidth="9" opacity="0.55" />
        <ellipse cx="455" cy="320" rx="46" ry="30" fill="#5e7d86" opacity="0.85" />
        <circle cx="120" cy="120" r="13" fill="#46603a" />
        <circle cx="520" cy="80" r="12" fill="#46603a" />
        <circle cx="80" cy="360" r="11" fill="#46603a" />

        {herd.map((a) => {
          const cx = (a.x / 100) * 600;
          const cy = (a.y / 100) * 440;
          const color = a.status === "critical" ? "#8a4f32" : a.status === "watch" ? "#9a9a5e" : "#588157";
          const r = a.status === "critical" ? 6.5 : 5;
          return (
            <circle
              key={a.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              stroke="#fff"
              strokeWidth="1.5"
              onClick={() => onSelect?.(a.id)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              {a.status === "critical" && (
                <animate attributeName="r" values={`${r};${r + 2.5};${r}`} dur="2s" repeatCount="indefinite" />
              )}
            </circle>
          );
        })}
      </svg>

      <div className="absolute top-[18px] right-[18px] flex flex-col gap-2 z-[4]">
        <ZoomButton onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} disabled={zoom >= 2.5} label="Zoom in">
          <Plus size={18} strokeWidth={2} color="var(--sage-deep)" />
        </ZoomButton>
        <ZoomButton onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} label="Zoom out">
          <Minus size={18} strokeWidth={2} color="var(--sage-deep)" />
        </ZoomButton>
        <ZoomButton onClick={() => setZoom(1)} disabled={zoom === 1} label="Reset zoom">
          <Maximize2 size={18} strokeWidth={2} color="var(--sage-deep)" />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-[38px] h-[38px] rounded-xl border-0 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-default"
      style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 10px rgba(0,0,0,0.12)" }}
    >
      {children}
    </button>
  );
}
