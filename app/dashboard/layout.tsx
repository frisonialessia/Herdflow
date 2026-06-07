import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { HerdProvider } from "@/components/HerdProvider";
import { AnimalDrawer } from "@/components/AnimalDrawer";
import { DemoControls } from "@/components/DemoControls";
import { DashboardShell } from "@/components/DashboardShell";
import { DemoAutoplay } from "@/components/DemoAutoplay";
import { loadHerd } from "@/lib/db/herd";
import { getSessionUserId } from "@/lib/auth/session";
import type { Animal } from "@/lib/types";

// Dual mode: with DATABASE_URL set, the dashboard reads the real herd from
// Postgres; without it (the public demo), HerdProvider falls back to the
// synthetic generator. force-dynamic so real mode queries per request.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let initialHerd: Animal[] | null = null;
  if (process.env.DATABASE_URL) {
    // Real mode requires a session; the herd is scoped to that user's orgs.
    const userId = getSessionUserId();
    if (!userId) redirect("/login");
    try {
      initialHerd = await loadHerd(userId);
    } catch (e) {
      console.error("loadHerd failed, falling back to synthetic:", e);
      initialHerd = null;
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto p-5">
      <div
        className="rounded-[28px] border p-6"
        style={{
          background: "linear-gradient(160deg,#f5f6ee 0%,#eaece0 100%)",
          borderColor: "var(--border)",
          boxShadow: "0 30px 60px -30px rgba(58,90,64,0.28)",
        }}
      >
        <HerdProvider initialHerd={initialHerd}>
          <TopNav />
          <DashboardShell>{children}</DashboardShell>
          <AnimalDrawer />
          <DemoControls />
          <DemoAutoplay />
        </HerdProvider>
      </div>
    </div>
  );
}
