import Link from "next/link";
import { ArrowLeft, ArrowRight, LineChart, Activity, Wheat, ShieldCheck, Radio, ClipboardList, Sun, ScanSearch, Users, Thermometer, Footprints, HeartPulse, Baby, ShieldAlert, Milk } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export const metadata = {
  title: "Guía — HerdFlow",
  description: "Aprende a usar HerdFlow: cómo funciona, cómo empezar y qué enfermedades detectamos — y qué hacer ante cada una.",
};

const CARD = "bg-white rounded-xl2 border p-6 text-left shadow-[0_10px_30px_-18px_rgba(58,90,64,0.20)]";

export default function GuiaPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ background: "rgba(240,240,232,0.78)", borderColor: "var(--border)" }}>
        <div className="max-w-[920px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={34} />
            <span className="font-sora text-xl font-bold tracking-tight">Herd<span style={{ color: "var(--sage)" }}>Flow</span></span>
          </Link>
          <Link href="/dashboard" className="text-white rounded-[30px] px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:-translate-y-[1px]" style={{ background: "var(--sage-deep)" }}>
            Abrir demo <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[920px] mx-auto px-6 pt-14 pb-8 md:pt-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] mb-5 transition-colors hover:text-[var(--ink)]" style={{ color: "var(--muted)" }}>
          <ArrowLeft size={15} strokeWidth={2} /> Volver al inicio
        </Link>
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] mb-2.5" style={{ color: "var(--sage)" }}>Guía</div>
        <h1 className="font-sora font-bold tracking-tight leading-[1.08]" style={{ fontSize: "clamp(30px,4.4vw,44px)" }}>
          Aprende a cuidar tu hato con datos
        </h1>
        <p className="text-[16.5px] mt-4 max-w-[640px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Qué hace HerdFlow, cómo empezar en cinco pasos y qué enfermedades detectamos —con la señal que las delata y qué hacer ante cada una.
        </p>
      </section>

      {/* How it works */}
      <Section id="como-funciona" kicker="En un minuto" title="Cómo funciona">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Mini icon={<Activity size={18} color="var(--sage-deep)" />} title="Cada animal, su normalidad" body="Calculamos una línea base móvil de 14 días por animal —temperatura, actividad, rumia y consumo—. Cada uno es su propio control, no el promedio del rebaño." />
          <Mini icon={<LineChart size={18} color="var(--sage-deep)" />} title="La desviación es la alerta" body="El z-score mide cuántas desviaciones estándar se aleja la última lectura de lo normal de ese animal. Si rebasa ±2σ, algo cambió." />
          <Mini icon={<ShieldCheck size={18} color="var(--sage-deep)" />} title="Antes de que se vea" body="La mayoría de las enfermedades alteran estas señales días antes de que el animal se vea enfermo. Ahí está la ventaja." />
        </div>
      </Section>

      {/* 5 steps */}
      <Section id="empezar" kicker="Manos a la obra" title="Empieza en 5 pasos" tinted>
        <ol className="flex flex-col gap-3">
          <StepRow n={1} title="Carga tu hato" body="Agrega tus animales con su raza y ficha —o usa “Cargar datos de ejemplo” para explorar. El campo de raza es libre: cabe cualquiera." />
          <StepRow n={2} title="Conecta tus datos" body="Vincula sensores en Integraciones (collares, bolos de temperatura, medidor de leche…), o captura lecturas a mano o por la API. Funciona con el equipo que ya tienes." />
          <StepRow n={3} title="Revisa el Resumen" body="El mapa en vivo y el panel de tu rol te dan el estado del hato de un vistazo: sanos, en vigilancia y críticos." />
          <StepRow n={4} title="Atiende “Hoy”" body="El centro de acción prioriza lo urgente del día: posibles brotes, críticos, celos en ventana y partos próximos." />
          <StepRow n={5} title="Trabaja los casos" body="Cada animal en alerta abre un caso: recónocelo, asígnalo, trátalo y resuélvelo. Todo queda en su historial médico." />
        </ol>
      </Section>

      {/* What we detect */}
      <Section id="deteccion" kicker="La medicina" title="Qué detectamos — y qué hacer">
        <p className="text-[14.5px] -mt-4 mb-7 max-w-[680px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Cada hallazgo es rastreable a una señal y un método; nunca una caja negra. Esto es apoyo a la decisión — no sustituye el criterio del veterinario.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Cond icon={<Thermometer size={17} color="var(--brown)" />} cond="Fiebre / mastitis" signal="Temperatura ↑ (z-score)" act="Aísla, revisa la ubre y toma temperatura rectal; llama al veterinario si se confirma." />
          <Cond icon={<Footprints size={17} color="var(--brown)" />} cond="Cojera" signal="Actividad ↓ sostenida" act="Revisa patas y andar; recorte funcional y tratamiento del miembro afectado." />
          <Cond icon={<Wheat size={17} color="var(--brown)" />} cond="Inapetencia / cetosis" signal="Rumia y consumo ↓" act="Revisa ración, acceso a alimento y agua; descarta cetosis en vacas recién paridas." />
          <Cond icon={<Sun size={17} color="var(--brown)" />} cond="Estrés calórico" signal="THI alto + jadeo" act="Sombra, agua fresca y aspersores en el pico del día; evita manejo y transporte." />
          <Cond icon={<ShieldAlert size={17} color="var(--brown)" />} cond="Brote respiratorio (BRD)" signal="Clúster de fiebre/respiración por zona" act="Aísla al grupo afectado, mejora la ventilación y avisa al veterinario pronto." />
          <Cond icon={<HeartPulse size={17} color="var(--brown)" />} cond="Celo (estro)" signal="Actividad ↑ (inquietud)" act="Confirma celo en pie y marca la ventana óptima de inseminación." />
          <Cond icon={<Baby size={17} color="var(--brown)" />} cond="Parto próximo / atrasado" signal="Días de gestación por especie" act="Mueve a la paridera a tiempo y vigila de cerca los partos atrasados." />
          <Cond icon={<Milk size={17} color="var(--brown)" />} cond="Mastitis subclínica" signal="SCC / conductividad ↑" act="Con medidor de leche: cultivo, terapia intramamaria y separa del tanque." />
        </div>
      </Section>

      {/* Reading an alert */}
      <Section id="alertas" kicker="Interpretar" title="Cómo leer una alerta" tinted>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Band color="var(--healthy)" label="Sano" range="dentro de ±2σ" body="Todas las señales en su rango normal. Sin acción." />
          <Band color="var(--watch)" label="En vigilancia" range="|z| > 2σ" body="Una señal se desvió. Vigila y revisa en el próximo manejo." />
          <Band color="var(--critical)" label="Crítico" range="|z| > 3σ" body="Desviación fuerte. Revisa hoy; suele anticiparse a los síntomas." />
        </div>
        <p className="text-[13.5px] mt-5 leading-relaxed" style={{ color: "var(--muted)" }}>
          Cada alerta muestra <b style={{ color: "var(--ink)" }}>qué métrica</b> cambió, <b style={{ color: "var(--ink)" }}>cuánto</b> (el z-score) y <b style={{ color: "var(--ink)" }}>la tendencia</b> — y a veces “marcado X horas antes” de volverse visible.
        </p>
      </Section>

      {/* Roles */}
      <Section id="roles" kicker="El equipo" title="Quién ve qué">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Role icon={<Users size={16} color="var(--sage-deep)" />} role="Propietario" body="Acceso total: operación, salud, finanzas, integraciones y gestión del equipo." />
          <Role icon={<ClipboardList size={16} color="var(--sage-deep)" />} role="Gerente" body="Operación del hato y finanzas (impacto y reportes); sin llaves de API." />
          <Role icon={<HeartPulse size={16} color="var(--sage-deep)" />} role="Veterinario" body="Casos, expedientes médicos, vacunas e historial — su mundo clínico, a fondo." />
          <Role icon={<Activity size={16} color="var(--sage-deep)" />} role="Cuidador" body="Los pendientes del día y el monitoreo del hato (compartido con el vet)." />
          <Role icon={<ScanSearch size={16} color="var(--sage-deep)" />} role="Lector" body="Solo lectura: ve todo, no modifica nada." />
        </div>
      </Section>

      {/* CTA */}
      <section className="max-w-[920px] mx-auto px-6 py-16">
        <div className="rounded-[28px] border p-9 md:p-12 text-center shadow-[0_24px_60px_-34px_rgba(58,90,64,0.4)]" style={{ borderColor: "var(--border)", background: "linear-gradient(160deg,#f6f7ef,#eceee2)" }}>
          <h2 className="font-sora text-[24px] md:text-[28px] font-semibold tracking-tight">Pruébalo con un hato de ejemplo</h2>
          <p className="text-[15px] mt-3 mb-6 max-w-[520px] mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
            Abre el demo, dispara una fiebre y mira la detección en acción — datos sintéticos, sin registro.
          </p>
          <Link href="/dashboard?play=fever" className="inline-flex items-center gap-2 text-white rounded-[30px] px-6 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ background: "var(--sage-deep)" }}>
            <Radio size={16} strokeWidth={2} /> Abrir el demo en vivo
          </Link>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-[920px] mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-3 text-[13px]" style={{ color: "var(--muted)" }}>
          <div className="flex items-center gap-2.5"><BrandMark size={24} /> <span>HerdFlow — salud predictiva del ganado</span></div>
          <Link href="/" className="transition-colors hover:text-[var(--ink)]">Inicio</Link>
        </div>
      </footer>
    </main>
  );
}

function Section({ id, kicker, title, tinted, children }: { id: string; kicker: string; title: string; tinted?: boolean; children: React.ReactNode }) {
  const inner = (
    <div className="max-w-[920px] mx-auto px-6 py-14 md:py-16">
      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: "var(--sage)" }}>{kicker}</div>
      <h2 className="font-sora text-[24px] md:text-[28px] font-semibold tracking-tight mb-7">{title}</h2>
      {children}
    </div>
  );
  return tinted ? (
    <section id={id} className="scroll-mt-20 border-y" style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}>{inner}</section>
  ) : (
    <section id={id} className="scroll-mt-20">{inner}</section>
  );
}

function Mini({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className={CARD}>
      <div className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3" style={{ background: "var(--card-soft)" }}>{icon}</div>
      <h3 className="font-sora text-[15.5px] font-semibold">{title}</h3>
      <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}

function StepRow({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className={`${CARD} flex gap-4 items-start`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-sora text-[14px] font-semibold text-white shrink-0" style={{ background: "var(--sage-deep)" }}>{n}</div>
      <div>
        <h3 className="font-sora text-[15.5px] font-semibold">{title}</h3>
        <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
      </div>
    </li>
  );
}

function Cond({ icon, cond, signal, act }: { icon: React.ReactNode; cond: string; signal: string; act: string }) {
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "var(--brown-soft)" }}>{icon}</span>
        <h3 className="font-sora text-[15px] font-semibold">{cond}</h3>
      </div>
      <div className="text-[12px] font-semibold uppercase tracking-wide mt-2 mb-1" style={{ color: "var(--faint)" }}>Señal</div>
      <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>{signal}</div>
      <div className="text-[12px] font-semibold uppercase tracking-wide mt-2.5 mb-1" style={{ color: "var(--faint)" }}>Qué hacer</div>
      <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{act}</div>
    </div>
  );
}

function Band({ color, label, range, body }: { color: string; label: string; range: string; body: string }) {
  return (
    <div className="bg-white rounded-xl2 border p-5 shadow-[0_10px_30px_-18px_rgba(58,90,64,0.20)]" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ background: color }} />
        <span className="font-sora text-[15px] font-semibold">{label}</span>
        <span className="ml-auto text-[12px] font-mono" style={{ color: "var(--muted)" }}>{range}</span>
      </div>
      <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}

function Role({ icon, role, body }: { icon: React.ReactNode; role: string; body: string }) {
  return (
    <div className={`${CARD} flex gap-3 items-start`}>
      <span className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "var(--card-soft)" }}>{icon}</span>
      <div>
        <h3 className="font-sora text-[15px] font-semibold">{role}</h3>
        <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
      </div>
    </div>
  );
}
