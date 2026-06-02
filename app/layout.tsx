import type { Metadata } from "next";
import "./globals.css";

// On Vercel this resolves to the production domain automatically, so OG/Twitter
// image URLs are absolute when the link is shared.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${site}`),
  title: "HerdFlow — Predictive livestock health",
  description:
    "Detect animal health anomalies — fever, lameness, off-feed — before they're visible to the eye, using per-animal z-score baselines.",
  openGraph: {
    title: "HerdFlow — Catch illness before it shows",
    description: "Predictive livestock health: per-animal z-score anomaly detection for cattle, sheep, horses and poultry.",
    type: "website",
    siteName: "HerdFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "HerdFlow — Catch illness before it shows",
    description: "Predictive livestock health with per-animal z-score anomaly detection.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
