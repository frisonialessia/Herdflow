import Link from "next/link";
import { Activity, ArrowRight, ShieldCheck, LineChart, Radio, Github } from "lucide-react";
import { HeroDemo } from "@/components/HeroDemo";
import { ZScoreExplainer } from "@/components/ZScoreExplainer";
import { FarmMapPreview } from "@/components/FarmMapPreview";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="max-w-[1100px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full animate-spin-slow"
            style={{
              background: "conic-gradient(from 120deg, var(--sage-light), var(--sage), var(--sage-deep), var(--sage-light))",
              boxShadow: "0 0 16px rgba(88,129,87,0.45)",
            }}
          />
          <span className="font-sora text-xl font-bold tracking-tight">
            Herd<span style={{ color: "var(--sage)" }}>Flow</span>
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-white rounded-[30px] px-5 py-2.5 text-sm font-medium flex items-center gap-2"
          style={{ background: "var(--sage-deep)" }}
        >
          Launch demo <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </header>

      <section className="max-w-[1100px] mx-auto px-6 pt-8 pb-16 grid lg:grid-cols-[1fr_1.05fr] gap-10 items-center">
        <div className="text-center lg:text-left">
          <span
            className="inline-flex items-center gap-2 text-[13px] rounded-[30px] px-4 py-1.5 border bg-white"
            style={{ borderColor: "var(--border)", color: "var(--sage-deep)" }}
          >
            <Activity size={14} strokeWidth={2} /> Predictive livestock health
          </span>
          <h1 className="font-sora font-bold tracking-tight mt-6 leading-[1.05]" style={{ fontSize: "clamp(32px,5vw,52px)" }}>
            Catch illness <em className="not-italic" style={{ color: "var(--sage)" }}>before</em> it shows.
          </h1>
          <p className="text-[17px] mt-5 max-w-[560px] mx-auto lg:mx-0 leading-relaxed" style={{ color: "var(--muted)" }}>
            HerdFlow scores every animal against its own rolling baseline — temperature, activity,
            rumination and feed intake — and flags fever, lameness or off-feed days before they&apos;re
            visible to the eye.
          </p>
          <div className="flex gap-3 mt-8 flex-wrap justify-center lg:justify-start">
            <Link
              href="/dashboard"
              className="text-white rounded-[30px] px-6 py-3 text-sm font-medium flex items-center gap-2"
              style={{ background: "var(--sage-deep)" }}
            >
              Launch the live demo <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <a
              href="https://github.com/frisonialessia/Herdflow"
              target="_blank"
              rel="noreferrer"
              className="rounded-[30px] px-6 py-3 text-sm font-medium flex items-center gap-2 border bg-white"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }}
            >
              <Github size={16} strokeWidth={2} /> View source
            </a>
          </div>
          <div className="text-[12.5px] mt-4" style={{ color: "var(--faint)" }}>Demo · synthetic data · no sign-up</div>
        </div>

        <HeroDemo />
      </section>

      <section className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="font-sora text-[26px] font-semibold tracking-tight">Your whole farm, at a glance</h2>
          <p className="text-[15px] mt-2 max-w-[620px] mx-auto" style={{ color: "var(--muted)" }}>
            Every animal on one live map — healthy, watch and critical at a glance. Click any pin to drill into its vitals.
          </p>
        </div>
        <FarmMapPreview />
      </section>

      <section className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="font-sora text-[26px] font-semibold tracking-tight">How it works</h2>
          <p className="text-[15px] mt-2" style={{ color: "var(--muted)" }}>From raw telemetry to an explainable alert — in three steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Step n={1} icon={<Radio size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Telemetry streams in" body="Wearables and sensors report temperature, activity, rumination and feed intake around the clock." />
          <Step n={2} icon={<LineChart size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Scored against itself" body="Each animal is compared to its own 14-day rolling baseline — a ±2σ band, not the herd average." />
          <Step n={3} icon={<ShieldCheck size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Flagged early" body="A z-score past ±2σ raises a watch, past ±3σ a critical — often days before anything is visible." />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 items-center">
          <div>
            <h3 className="font-sora text-[20px] font-semibold tracking-tight">The math, in one picture</h3>
            <p className="text-[15px] mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
              The z-score measures how many standard deviations a reading sits from that animal&apos;s normal.
              Stay inside the band and all is well; break it and HerdFlow flags exactly which signal moved — and by how much.
            </p>
          </div>
          <ZScoreExplainer />
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Feature
          icon={<LineChart size={20} strokeWidth={2} color="var(--sage-deep)" />}
          title="Per-animal baselines"
          body="Each animal is its own control. We compute a rolling mean ±2σ band and z-score the latest reading against its own history — not the herd average."
        />
        <Feature
          icon={<ShieldCheck size={20} strokeWidth={2} color="var(--sage-deep)" />}
          title="Early, explainable alerts"
          body="|z|>2 raises a watch, |z|>3 a critical. Every alert shows the metric, the deviation and the trend that triggered it."
        />
        <Feature
          icon={<Radio size={20} strokeWidth={2} color="var(--sage-deep)" />}
          title="Live telemetry"
          body="Watch readings stream in and the herd health index move in real time — or trigger an anomaly and see detection fire."
        />
      </section>

      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="max-w-[1100px] mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-3 text-[13px]"
          style={{ color: "var(--muted)" }}
        >
          <span>HerdFlow — predictive livestock health · Building in Public</span>
          <span>All data synthetic · for demonstration</span>
        </div>
      </footer>
    </main>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white border rounded-xl2 p-6 text-left" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-sora text-[14px] font-semibold text-white" style={{ background: "var(--sage-deep)" }}>{n}</div>
        <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ background: "var(--card-soft)" }}>{icon}</div>
      </div>
      <h3 className="font-sora text-[16px] font-semibold">{title}</h3>
      <p className="text-[14px] mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white border rounded-xl2 p-6 text-left" style={{ borderColor: "var(--border)" }}>
      <div className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4" style={{ background: "var(--card-soft)" }}>
        {icon}
      </div>
      <h3 className="font-sora text-[17px] font-semibold">{title}</h3>
      <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}
