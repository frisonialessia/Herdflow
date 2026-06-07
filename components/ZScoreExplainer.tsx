// Static visual explainer of the z-score idea: a ±2σ band around a baseline,
// one normal reading inside it and one anomalous reading that breaks it.

const W = 480;
const H = 180;
const MEAN = 50;
const SIGMA = 6;
const UPPER = MEAN + 2 * SIGMA;
const LOWER = MEAN - 2 * SIGMA;
const Y_MIN = 30;
const Y_MAX = 80;
const y = (v: number) => H - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * H;

export function ZScoreExplainer() {
  return (
    <div className="bg-white border rounded-xl2 p-5" style={{ borderColor: "var(--border)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[180px] block">
        <rect x="0" y={y(UPPER)} width={W} height={y(LOWER) - y(UPPER)} fill="#588157" fillOpacity="0.14" />
        <line x1="0" y1={y(MEAN)} x2={W} y2={y(MEAN)} stroke="#588157" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx={W * 0.32} cy={y(53)} r="6" fill="#588157" stroke="#fff" strokeWidth="2" />
        <circle cx={W * 0.74} cy={y(72)} r="7" fill="#8a4f32" stroke="#fff" strokeWidth="2" />
        <text x={W * 0.32} y={y(53) + 24} textAnchor="middle" fontFamily="Outfit" fontSize="11" fill="#6e7568">|z| 0.5 · normal</text>
        <text x={W * 0.74} y={y(72) - 13} textAnchor="middle" fontFamily="Outfit" fontSize="11" fill="#8a4f32">|z| 3.5 · crítico</text>
        <text x="6" y={y(MEAN) - 6} fontFamily="Outfit" fontSize="11" fill="#588157">línea base</text>
        <text x="6" y={y(UPPER) - 6} fontFamily="Outfit" fontSize="10" fill="#9aa091">+2σ</text>
        <text x="6" y={y(LOWER) + 14} fontFamily="Outfit" fontSize="10" fill="#9aa091">−2σ</text>
      </svg>
      <div className="flex flex-wrap gap-3 mt-3 text-[12.5px]" style={{ color: "var(--muted)" }}>
        <span className="flex items-center gap-1.5"><span className="w-[12px] h-[10px] rounded-[3px]" style={{ background: "rgba(88,129,87,0.16)" }} /> Rango normal ±2σ</span>
        <span className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-full" style={{ background: "var(--watch)" }} /> |z| ≥ 2 vigilancia</span>
        <span className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-full" style={{ background: "var(--critical)" }} /> |z| ≥ 3 crítico</span>
      </div>
    </div>
  );
}
