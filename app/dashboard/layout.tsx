import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { BoardNav } from "@/components/BoardNav";
import { HerdProvider } from "@/components/HerdProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { RoleProvider } from "@/components/RoleProvider";
import { AnimalDrawer } from "@/components/AnimalDrawer";
import { DemoControls } from "@/components/DemoControls";
import { DashboardShell } from "@/components/DashboardShell";
import { DemoAutoplay } from "@/components/DemoAutoplay";
import { loadHerd, loadOperationalState, type OperationalState } from "@/lib/db/herd";
import { getSessionUserId } from "@/lib/auth/session";
import type { Animal } from "@/lib/types";

// Dual mode: with DATABASE_URL set, the dashboard reads the real herd from
// Postgres; without it (the public demo), HerdProvider falls back to the
// synthetic generator. force-dynamic so real mode queries per request.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let initialHerd: Animal[] | null = null;
  let initialOps: OperationalState | null = null;
  if (process.env.DATABASE_URL) {
    // Real mode requires a session; the herd is scoped to that user's orgs.
    const userId = getSessionUserId();
    if (!userId) redirect("/login");
    try {
      initialHerd = await loadHerd(userId);
      initialOps = await loadOperationalState(userId);
    } catch (e) {
      console.error("loadHerd failed, falling back to synthetic:", e);
      initialHerd = null;
      initialOps = null;
    }
  }
  // Persist mutations only when we actually loaded a real herd (DB ids).
  const persisted = initialHerd !== null;

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
        <RoleProvider>
          <CurrencyProvider>
            <HerdProvider initialHerd={initialHerd} initialOps={initialOps} persisted={persisted}>
              <TopNav />
              <BoardNav />
              <DashboardShell>{children}</DashboardShell>
              <AnimalDrawer />
              <DemoControls />
              <DemoAutoplay />
            </HerdProvider>
          </CurrencyProvider>
        </RoleProvider>
      </div>
    </div>
  );
}
