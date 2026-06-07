import type { Metadata } from "next";
import "./globals.css";

// On Vercel this resolves to the production domain automatically, so OG/Twitter
// image URLs are absolute when the link is shared.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${site}`),
  title: "HerdFlow — Salud predictiva del ganado",
  description:
    "Detecta anomalías de salud animal —fiebre, cojera, falta de apetito— antes de que se vean a simple vista, con líneas base de z-score por animal.",
  openGraph: {
    title: "HerdFlow — Detecta enfermedades antes de que se vean",
    description: "Salud predictiva del ganado: detección de anomalías por z-score, animal por animal, para bovinos, ovinos, equinos y aves.",
    type: "website",
    siteName: "HerdFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "HerdFlow — Detecta enfermedades antes de que se vean",
    description: "Salud predictiva del ganado con detección de anomalías por z-score, animal por animal.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
