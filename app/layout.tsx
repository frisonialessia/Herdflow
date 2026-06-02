import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HerdFlow — Predictive livestock health",
  description: "Detect animal health anomalies before they're visible to the eye.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
