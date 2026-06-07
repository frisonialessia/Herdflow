import Link from "next/link";
import { Activity, ArrowRight, ShieldCheck, LineChart, Radio, Github, Thermometer } from "lucide-react";
import { HeroDemo } from "@/components/HeroDemo";
import { ZScoreExplainer } from "@/components/ZScoreExplainer";
import { FarmMapPreview } from "@/components/FarmMapPreview";
import { BrandMark } from "@/components/BrandMark";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="max-w-[1100px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark size={34} />
          <span className="font-sora text-xl font-bold tracking-tight">
            Herd<span style={{ color: "var(--sage)" }}>Flow</span>
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-white rounded-[30px] px-5 py-2.5 text-sm font-medium flex items-center gap-2"
          style={{ background: "var(--sage-deep)" }}
        >
          Abrir demo <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </header>

      <section className="max-w-[1100px] mx-auto px-6 pt-8 pb-16 grid lg:grid-cols-[1fr_1.05fr] gap-10 items-center">
        <div className="text-center lg:text-left">
          <span
            className="inline-flex items-center gap-2 text-[13px] rounded-[30px] px-4 py-1.5 border bg-white"
            style={{ borderColor: "var(--border)", color: "var(--sage-deep)" }}
          >
            <Activity size={14} strokeWidth={2} /> Salud predictiva del ganado
          </span>
          <h1 className="font-sora font-bold tracking-tight mt-6 leading-[1.05]" style={{ fontSize: "clamp(32px,5vw,52px)" }}>
            Detecta la enfermedad <em className="not-italic" style={{ color: "var(--sage)" }}>antes</em> de que se vea.
          </h1>
          <p className="text-[17px] mt-5 max-w-[560px] mx-auto lg:mx-0 leading-relaxed" style={{ color: "var(--muted)" }}>
            HerdFlow evalúa a cada animal contra su propia línea base móvil —temperatura, actividad,
            rumia y consumo de alimento— y detecta fiebre, cojera o días sin apetito antes de que sean
            visibles a simple vista.
          </p>
          <div className="flex gap-3 mt-8 flex-wrap justify-center lg:justify-start">
            <Link
              href="/dashboard?play=fever"
              className="text-white rounded-[30px] px-6 py-3 text-sm font-medium flex items-center gap-2"
              style={{ background: "var(--sage-deep)" }}
            >
              <Thermometer size={16} strokeWidth={2} /> Míralo detectar una fiebre
            </Link>
            <a
              href="https://github.com/frisonialessia/Herdflow"
              target="_blank"
              rel="noreferrer"
              className="rounded-[30px] px-6 py-3 text-sm font-medium flex items-center gap-2 border bg-white"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }}
            >
              <Github size={16} strokeWidth={2} /> Ver código
            </a>
          </div>
          <div className="text-[12.5px] mt-4" style={{ color: "var(--faint)" }}>Demo · datos sintéticos · sin registro</div>
        </div>

        <HeroDemo />
      </section>

      <section className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="font-sora text-[26px] font-semibold tracking-tight">Todo tu rancho, de un vistazo</h2>
          <p className="text-[15px] mt-2 max-w-[620px] mx-auto" style={{ color: "var(--muted)" }}>
            Cada animal en un solo mapa en vivo —sanos, en observación y críticos de un vistazo. Toca cualquier marcador para ver sus signos vitales.
          </p>
        </div>
        <FarmMapPreview />
      </section>

      <section className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="font-sora text-[26px] font-semibold tracking-tight">Cómo funciona</h2>
          <p className="text-[15px] mt-2" style={{ color: "var(--muted)" }}>De la telemetría en bruto a una alerta explicable — en tres pasos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Step n={1} icon={<Radio size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Llega la telemetría" body="Los dispositivos y sensores reportan temperatura, actividad, rumia y consumo de alimento las 24 horas." />
          <Step n={2} icon={<LineChart size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Se evalúa contra sí mismo" body="Cada animal se compara con su propia línea base móvil de 14 días — una banda de ±2σ, no el promedio del rebaño." />
          <Step n={3} icon={<ShieldCheck size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Se detecta a tiempo" body="Un z-score que rebasa ±2σ levanta una observación; más allá de ±3σ, una alerta crítica — a menudo días antes de que algo sea visible." />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 items-center">
          <div>
            <h3 className="font-sora text-[20px] font-semibold tracking-tight">Las matemáticas, en una sola imagen</h3>
            <p className="text-[15px] mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
              El z-score mide cuántas desviaciones estándar se aleja una lectura de lo normal de ese animal.
              Si se mantiene dentro de la banda, todo está bien; si la rebasa, HerdFlow señala exactamente qué señal cambió — y por cuánto.
            </p>
          </div>
          <ZScoreExplainer />
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Feature
          icon={<LineChart size={20} strokeWidth={2} color="var(--sage-deep)" />}
          title="Líneas base por animal"
          body="Cada animal es su propio control. Calculamos una media móvil con banda de ±2σ y aplicamos el z-score a la última lectura contra su propio historial — no contra el promedio del rebaño."
        />
        <Feature
          icon={<ShieldCheck size={20} strokeWidth={2} color="var(--sage-deep)" />}
          title="Alertas tempranas y explicables"
          body="|z|>2 levanta una observación; |z|>3, una crítica. Cada alerta muestra la métrica, la desviación y la tendencia que la disparó."
        />
        <Feature
          icon={<Radio size={20} strokeWidth={2} color="var(--sage-deep)" />}
          title="Telemetría en vivo"
          body="Observa cómo llegan las lecturas y el índice de salud del rebaño se mueve en tiempo real — o dispara una anomalía y mira la detección en acción."
        />
      </section>

      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="max-w-[1100px] mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-3 text-[13px]"
          style={{ color: "var(--muted)" }}
        >
          <span>HerdFlow — salud predictiva del ganado · Building in Public</span>
          <span>Todos los datos son sintéticos · solo para demostración</span>
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
