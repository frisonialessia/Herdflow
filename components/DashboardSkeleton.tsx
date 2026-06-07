// Loading placeholder shown while the dashboard "connects". Generic shimmer
// that roughly mirrors the Overview layout, using the brand's soft card colour.

export function DashboardSkeleton() {
  return (
    <div className="animate-fade">
      <div className="flex items-center gap-2 text-[13px] mb-5" style={{ color: "var(--muted)" }}>
        <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: "var(--sage)" }} />
        Conectando con los sensores…
      </div>

      <div className="flex items-center justify-between mb-[22px]">
        <Block w="220px" h="34px" />
        <Block w="260px" h="42px" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-[18px]">
        <Block h="440px" />
        <div className="flex flex-col gap-[18px]">
          <Block h="211px" />
          <Block h="211px" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-[18px]">
        <Block h="118px" />
        <Block h="118px" />
        <Block h="118px" />
      </div>
    </div>
  );
}

function Block({ w, h }: { w?: string; h?: string }) {
  return (
    <div
      className="rounded-[18px] animate-pulse"
      style={{ width: w ?? "100%", height: h ?? "100%", background: "var(--card-soft)" }}
    />
  );
}
