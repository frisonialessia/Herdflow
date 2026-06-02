"use client";

// Reads a ?play= query param on entering the dashboard and kicks off a scripted
// demo, so a landing CTA can drop visitors straight into "watch it work":
//   ?play=fever      -> simulate a fever on a healthy animal and open its drawer
//   ?play=live       -> turn on live telemetry
//   ?play=live+fever -> both
// Uses window.location (not useSearchParams) to avoid a Suspense boundary and
// keep the dashboard statically prerendered.

import { useEffect, useRef } from "react";
import { useHerd } from "@/components/HerdProvider";

export function DemoAutoplay() {
  const { herd, simulate, selectAnimal, setLive } = useHerd();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const play = new URLSearchParams(window.location.search).get("play");
    if (!play) return;
    done.current = true;

    // Small delay so the dashboard renders first — then the anomaly "gets caught".
    const t = setTimeout(() => {
      if (play === "live") {
        setLive(true);
        return;
      }
      const pool = herd.filter((a) => a.status === "healthy");
      const pick = pool[Math.floor(Math.random() * pool.length)] ?? herd[0];
      if (pick) {
        simulate(pick.id, "temperature_c");
        selectAnimal(pick.id);
      }
      if (play === "live+fever") setLive(true);
    }, 1000);

    return () => clearTimeout(t);
  }, [herd, simulate, selectAnimal, setLive]);

  return null;
}
