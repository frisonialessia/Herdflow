"use client";

// Brief "connecting to sensors" state on first entry to the dashboard. The data
// is synthetic and instant, so this is a deliberate perceived-loading moment
// (it makes the live-telemetry framing feel real), not masking real latency.
// The state lives in the dashboard layout, so it only shows on first mount —
// navigating between dashboard pages keeps it ready.

import { useEffect, useState } from "react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(t);
  }, []);

  return ready ? <>{children}</> : <DashboardSkeleton />;
}
