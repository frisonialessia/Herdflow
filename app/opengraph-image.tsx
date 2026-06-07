import { ImageResponse } from "next/og";

export const alt = "HerdFlow — Salud predictiva del ganado";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social card, generated at build time (no binary asset needed).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#eef0e6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: "#588157" }} />
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#232c22" }}>HerdFlow</div>
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: "#232c22", marginTop: 44, lineHeight: 1.05 }}>
          Detecta enfermedades antes de que se vean.
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#6e7568", marginTop: 30 }}>
          Salud predictiva del ganado · detección por z-score, animal por animal
        </div>
        <div style={{ display: "flex", marginTop: 46, gap: 12 }}>
          {["#588157", "#9a9a5e", "#8a4f32"].map((c) => (
            <div key={c} style={{ width: 54, height: 12, borderRadius: 6, background: c }} />
          ))}
        </div>
      </div>
    ),
    size
  );
}
