import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { HerdProvider } from "@/components/HerdProvider";
import { AnimalDrawer } from "@/components/AnimalDrawer";
import { DemoControls } from "@/components/DemoControls";

export const metadata: Metadata = {
  title: "HerdFlow — Predictive livestock health",
  description: "Detect animal health anomalies before they're visible to the eye.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-[1280px] mx-auto p-5">
          <div
            className="rounded-[28px] border p-6"
            style={{
              background: "linear-gradient(160deg,#f5f6ee 0%,#eaece0 100%)",
              borderColor: "var(--border)",
              boxShadow: "0 30px 60px -30px rgba(58,90,64,0.28)",
            }}
          >
            <HerdProvider>
              <TopNav />
              {children}
              <AnimalDrawer />
              <DemoControls />
            </HerdProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
