"use client";

// Clinical media for an animal: upload photos / short video, and run a (demo)
// AI image analysis that returns a plausible visual diagnosis. Each upload and
// each AI reading is written to the animal's history timeline. Demo-only — files
// live in memory (object URLs); the AI is simulated (lib/vision_demo) and clearly
// labelled. The contract is the real one, so swapping in a real vision model
// later changes nothing here.

import { useRef, useState } from "react";
import { Animal } from "@/lib/types";
import { useHerd } from "@/components/HerdProvider";
import { useRole } from "@/components/RoleProvider";
import { can } from "@/lib/roles";
import { SEVERITY_LABEL, type VisionFinding } from "@/lib/vision_demo";
import { Camera, ScanSearch, Upload, Sparkles, Image as ImageIcon, Video } from "lucide-react";

const SEV_COLOR = { healthy: "var(--healthy)", watch: "var(--watch)", critical: "var(--critical)" } as const;

export function AnimalMedia({ animal: a }: { animal: Animal }) {
  const { mediaFor, addMedia, analyzeMedia } = useHerd();
  const { role } = useRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const items = mediaFor(a.id);
  const canEdit = can(role, "manageCases"); // vet / cuidador / gerente / dueño

  function onFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const kind = file.type.startsWith("video") ? "video" : "image";
      addMedia(a.id, { kind, url: URL.createObjectURL(file), name: file.name });
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function analyze(mediaId: string) {
    setAnalyzing(mediaId);
    // A tiny delay reads as "the model is thinking" (demo flourish).
    setTimeout(() => {
      analyzeMedia(a.id, mediaId);
      setAnalyzing(null);
    }, 650);
  }

  return (
    <div className="bg-white border rounded-[14px] p-4 mb-5 shadow-[0_6px_20px_-14px_rgba(58,90,64,0.16)]" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Camera size={16} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--sage-deep)" }}>Imágenes y video</h3>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-[2px] rounded-[20px]" style={{ background: "var(--sage-light)", color: "var(--sage-deep)" }}>
          <Sparkles size={11} strokeWidth={2.4} /> IA · demo
        </span>
      </div>

      {canEdit && (
        <>
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-dashed py-2.5 text-[13px] font-medium cursor-pointer mb-3"
            style={{ borderColor: "var(--border)", color: "var(--sage-deep)", background: "var(--card-soft)" }}
          >
            <Upload size={15} strokeWidth={2} /> Subir foto o video
          </button>
        </>
      )}

      {items.length === 0 ? (
        <div className="text-[12.5px] text-center py-2" style={{ color: "var(--faint)" }}>
          Sube una foto del ojo, piel, pezuña o ubre y la IA sugiere un hallazgo.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-[12px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-3 p-2.5">
                <div className="w-[84px] h-[84px] rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--card-soft)" }}>
                  {m.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <video src={m.url} className="w-full h-full object-cover" muted playsInline />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--ink)" }}>
                    {m.kind === "image" ? <ImageIcon size={13} strokeWidth={2} color="var(--brown)" /> : <Video size={13} strokeWidth={2} color="var(--brown)" />}
                    <span className="truncate">{m.name}</span>
                  </div>
                  {!m.ai && canEdit && (
                    <button
                      onClick={() => analyze(m.id)}
                      disabled={analyzing === m.id}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-[20px] px-3 py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-60 text-white"
                      style={{ background: "var(--sage-deep)" }}
                    >
                      <ScanSearch size={13} strokeWidth={2.2} /> {analyzing === m.id ? "Analizando…" : "Analizar con IA"}
                    </button>
                  )}
                  {!m.ai && !canEdit && <div className="mt-2 text-[11.5px]" style={{ color: "var(--faint)" }}>Sin análisis.</div>}
                </div>
              </div>
              {m.ai && <AiResult finding={m.ai} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiResult({ finding }: { finding: VisionFinding }) {
  const color = SEV_COLOR[finding.severity];
  return (
    <div className="border-t px-3 py-3" style={{ borderColor: "var(--border)", background: "var(--card-soft)" }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          {finding.condition}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-[2px] rounded-[20px] text-white" style={{ background: color }}>
          {SEVERITY_LABEL[finding.severity]}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{ width: `${finding.confidence}%`, background: color }} />
        </div>
        <span className="text-[11.5px] font-semibold" style={{ color: "var(--muted)" }}>{finding.confidence}%</span>
      </div>

      <div className="text-[12px] mb-1" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--faint)" }}>Zona:</span> {finding.area}
      </div>
      <div className="text-[12.5px] leading-snug mb-1.5" style={{ color: "var(--ink)" }}>{finding.recommendation}</div>
      {finding.differentials.length > 0 && (
        <div className="text-[11.5px]" style={{ color: "var(--faint)" }}>Diferenciales: {finding.differentials.join(" · ")}</div>
      )}
      <div className="text-[10.5px] mt-2 italic" style={{ color: "var(--faint)" }}>
        Análisis simulado — apoyo a la decisión, no sustituye el criterio del veterinario.
      </div>
    </div>
  );
}
