import { TopNav } from "@/components/TopNav";
import { HerdProvider } from "@/components/HerdProvider";
import { AnimalDrawer } from "@/components/AnimalDrawer";
import { DemoControls } from "@/components/DemoControls";
import { DashboardShell } from "@/components/DashboardShell";
import { DemoAutoplay } from "@/components/DemoAutoplay";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
        <HerdProvider>
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
