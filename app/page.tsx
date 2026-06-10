import Link from "next/link";
import { Activity, ArrowRight, ShieldCheck, LineChart, Radio, Github, Thermometer, ShieldAlert, HeartPulse, Baby, Footprints, Wheat, Sun, ScanSearch, Stethoscope, Check } from "lucide-react";
import { HeroDemo } from "@/components/HeroDemo";
import { ZScoreExplainer } from "@/components/ZScoreExplainer";
import { FarmMapPreview } from "@/components/FarmMapPreview";
import { BrandMark } from "@/components/BrandMark";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SpeciesBreeds } from "@/components/SpeciesBreeds";
import { PLANS } from "@/lib/plans";

// Premium card: white, soft green-tinted depth, gentle lift on hover.
const CARD =
  "bg-white rounded-xl2 border transition-all duration-200 shadow-[0_10px_30px_-18px_rgba(58,90,64,0.22)] hover:shadow-[0_22px_44px_-20px_rgba(58,90,64,0.30)] hover:-translate-y-[3px]";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ background: "rgba(240,240,232,0.78)", borderColor: "var(--border)" }}
      >
        <div className="max-w-[1100px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={34} />
            <span className="font-sora text-xl font-bold tracking-tight">
              Herd<span style={{ color: "var(--sage)" }}>Flow</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[14px]" style={{ color: "var(--muted)" }}>
            <a href="#capacidades" className="transition-colors hover:text-[var(--ink)]">Capacidades</a>
            <a href="#deteccion" className="transition-colors hover:text-[var(--ink)]">Qué detectamos</a>
            <a href="#como-funciona" className="transition-colors hover:text-[var(--ink)]">Cómo funciona</a>
            <a href="#precios" className="transition-colors hover:text-[var(--ink)]">Precios</a>
            <Link href="/guia" className="transition-colors hover:text-[var(--ink)]">Guía</Link>
          </nav>
          <Link
            href="/dashboard"
            className="text-white rounded-[30px] px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-[0_10px_24px_-10px_rgba(58,90,64,0.6)] hover:-translate-y-[1px] shrink-0"
            style={{ background: "var(--sage-deep)" }}
          >
            Abrir demo <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-[1100px] mx-auto px-6 pt-14 pb-12 md:pt-20 md:pb-16 grid lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
        <div className="text-center lg:text-left">
          <span
            className="inline-flex items-center gap-2 text-[13px] font-medium rounded-[30px] px-4 py-1.5 border bg-white shadow-[0_4px_14px_-8px_rgba(58,90,64,0.3)]"
            style={{ borderColor: "var(--border)", color: "var(--sage-deep)" }}
          >
            <Activity size={14} strokeWidth={2} /> Salud predictiva del ganado
          </span>
          <h1 className="font-sora font-bold tracking-tight mt-6 leading-[1.04]" style={{ fontSize: "clamp(34px,5.2vw,56px)" }}>
            Detecta la enfermedad <em className="not-italic" style={{ color: "var(--sage)" }}>antes</em> de que se vea.
          </h1>
          <p className="text-[17px] mt-5 max-w-[560px] mx-auto lg:mx-0 leading-relaxed" style={{ color: "var(--muted)" }}>
            HerdFlow evalúa a cada animal contra su propia línea base —temperatura, actividad, rumia y consumo— y
            detecta fiebre, cojera o días sin apetito antes de que sean visibles a simple vista.
          </p>
          <div className="flex gap-3 mt-8 flex-wrap justify-center lg:justify-start">
            <Link
              href="/dashboard?play=fever"
              className="text-white rounded-[30px] px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-[0_14px_30px_-12px_rgba(58,90,64,0.65)] hover:-translate-y-[1px]"
              style={{ background: "var(--sage-deep)" }}
            >
              <Thermometer size={16} strokeWidth={2} /> Míralo detectar una fiebre
            </Link>
            <a
              href="#como-funciona"
              className="rounded-[30px] px-6 py-3 text-sm font-medium flex items-center gap-2 border bg-white transition-colors duration-200 hover:bg-[var(--card-soft)]"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }}
            >
              <LineChart size={16} strokeWidth={2} /> Cómo funciona
            </a>
          </div>
          <div className="flex items-start gap-2 mt-6 text-[13px] max-w-[520px] mx-auto lg:mx-0" style={{ color: "var(--muted)" }}>
            <Radio size={15} strokeWidth={2} color="var(--sage-deep)" className="mt-0.5 shrink-0" />
            <span>
              <b style={{ color: "var(--ink)" }}>Sin cambiar tu equipo:</b> funciona con los collares y sensores que ya usas — o empieza capturando los datos a mano.
            </span>
          </div>
          <div className="text-[12.5px] mt-3" style={{ color: "var(--faint)" }}>Demo · datos sintéticos · sin registro</div>
        </div>

        <HeroDemo />
      </section>

      {/* Trust strip */}
      <section className="max-w-[1100px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl2 overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--border)" }}>
          <Stat k="6" label="señales vitales por animal" />
          <Stat k="14 d" label="línea base móvil" />
          <Stat k="±2σ" label="alertas explicables" />
          <Stat k="24/7" label="monitoreo en vivo" />
        </div>
      </section>

      {/* Breeds */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
        <SectionHead kicker="Para todo tu ganado" title="Hecho para tus animales — y tus razas">
          Cada especie y raza tiene su propia línea base: lo que come y cómo se cuida un Holstein no es lo que un Brahman. Y si la tuya no está, la agregas tú — el campo es libre.
        </SectionHead>
        <SpeciesBreeds />
      </section>

      {/* Live map */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
        <SectionHead kicker="El mapa" title="Todo tu rancho, de un vistazo">
          Cada animal en un solo mapa en vivo —sanos, en observación y críticos de un vistazo. Toca cualquier marcador para ver sus signos vitales.
        </SectionHead>
        <FarmMapPreview />
      </section>

      {/* How it works — full-width tinted band */}
      <section id="como-funciona" className="scroll-mt-20 border-y" style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
          <SectionHead kicker="El método" title="Cómo funciona">
            De la telemetría en bruto a una alerta explicable — en tres pasos.
          </SectionHead>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            <Step n={1} icon={<Radio size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Llega la telemetría" body="Los dispositivos y sensores reportan temperatura, actividad, rumia y consumo de alimento las 24 horas." />
            <Step n={2} icon={<LineChart size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Se evalúa contra sí mismo" body="Cada animal se compara con su propia línea base móvil de 14 días — una banda de ±2σ, no el promedio del rebaño." />
            <Step n={3} icon={<ShieldCheck size={18} strokeWidth={2} color="var(--sage-deep)" />} title="Se detecta a tiempo" body="Un z-score que rebasa ±2σ levanta una observación; más allá de ±3σ, una alerta crítica — a menudo días antes de que algo sea visible." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 items-center">
            <div>
              <h3 className="font-sora text-[21px] font-semibold tracking-tight">Las matemáticas, en una sola imagen</h3>
              <p className="text-[15.5px] mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
                El z-score mide cuántas desviaciones estándar se aleja una lectura de lo normal de ese animal. Si se
                mantiene dentro de la banda, todo está bien; si la rebasa, HerdFlow señala exactamente qué señal cambió — y por cuánto.
              </p>
            </div>
            <ZScoreExplainer />
          </div>
        </div>
      </section>

      {/* Capabilities — the breadth */}
      <section id="capacidades" className="scroll-mt-20 max-w-[1100px] mx-auto px-6 py-16 md:py-20">
        <SectionHead kicker="La plataforma" title="Una sola plataforma para toda la salud de tu ganado">
          No es solo una alerta de fiebre. HerdFlow cubre el ciclo completo —salud, reproducción, bienestar y operación— sobre el mismo motor de líneas base por animal.
        </SectionHead>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature icon={<LineChart size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Detección temprana" body="Línea base por animal con banda ±2σ: la anomalía se marca a menudo días antes de ser visible a simple vista." />
          <Feature icon={<ShieldAlert size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Brotes y bioseguridad" body="Detecta clústeres de animales que se desvían juntos por zona del rancho — aísla antes de que se propague." />
          <Feature icon={<HeartPulse size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Reproducción y celo" body="Detección de celo por actividad y la ventana óptima de inseminación, vaca por vaca." />
          <Feature icon={<Baby size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Maternidad y partos" body="Vacas próximas a parir y partos atrasados según la gestación de cada especie." />
          <Feature icon={<Footprints size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Movilidad y cojera" body="Puntaje de cojera (0–3) por animal a partir de la caída de actividad sostenida." />
          <Feature icon={<Wheat size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Nutrición" body="Inapetencia, rumia baja y condición corporal — la señal más temprana de que algo anda mal." />
          <Feature icon={<Sun size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Estrés calórico (THI)" body="Índice de calor del día y los animales en mayor riesgo, con plan de sombra, agua y aspersores." />
          <Feature icon={<ScanSearch size={20} strokeWidth={2} color="var(--sage-deep)" />} title="IA por imagen" body="Sube una foto del ojo, piel, pezuña o ubre y la IA sugiere un hallazgo clínico — apoyo al diagnóstico." />
          <Feature icon={<Stethoscope size={20} strokeWidth={2} color="var(--sage-deep)" />} title="Expediente y equipo" body="Ficha, vacunas, tratamientos e historial por animal — e invita a tu veterinario, gerente y cuidador con su propio rol." />
        </div>
      </section>

      {/* What we detect — full-width tinted band */}
      <section id="deteccion" className="scroll-mt-20 border-y" style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
          <SectionHead kicker="La medicina" title="Qué enfermedades detectamos — y cómo">
            Cada hallazgo es rastreable a una señal y un método. Nada de cajas negras: ves qué cambió, cuánto y por qué.
          </SectionHead>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Detect cond="Fiebre / mastitis" signal="Temperatura ↑" how="z-score sobre su propia línea base. Aísla, revisa ubre y toma temperatura rectal." />
            <Detect cond="Cojera" signal="Actividad ↓" how="Caída sostenida contra su patrón circadiano. Revisa pezuñas y andar." />
            <Detect cond="Inapetencia / cetosis" signal="Rumia y consumo ↓" how="Desviación temprana del consumo. Revisa ración, agua y cetosis en vacas frescas." />
            <Detect cond="Estrés calórico" signal="THI del rancho ↑" how="Índice ambiental + jadeo. Plan de sombra, agua y aspersores en el pico del día." />
            <Detect cond="Brote respiratorio (BRD)" signal="Clúster de fiebre / respiración" how="Análisis espacial: varios animales desviándose juntos en una zona. Aísla y ventila." />
            <Detect cond="Celo (estro)" signal="Actividad ↑ (inquietud)" how="Pico contra su línea base. Marca la ventana óptima de inseminación." />
            <Detect cond="Parto próximo / atrasado" signal="Gestación por especie" how="Calendario de maternidad. Mueve a paridera y vigila los atrasados." />
            <Detect cond="Deshidratación / agua" signal="Consumo de agua ↓" how="Bebederos inteligentes alimentan el consumo por grupo. Revisa acceso y calidad." />
          </div>
          <p className="text-center text-[13px] mt-9" style={{ color: "var(--faint)" }}>
            Apoyo a la decisión — no sustituye el criterio del veterinario.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="scroll-mt-20 max-w-[1100px] mx-auto px-6 py-16 md:py-20">
        <SectionHead kicker="Precios" title="Planes que crecen con tu rancho">
          Sin hardware obligatorio y sin tarjeta para probar el demo. Pagas por animales monitoreados, no por funciones bloqueadas.
        </SectionHead>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          <Tier
            name="Inicial"
            price={`$${PLANS.free.priceMxn.toLocaleString("es-MX")}`}
            period="MXN / mes"
            limit="Hasta 50 animales"
            features={["Los 9 tableros de salud", "1 sitio · alertas en la app", "Razas y expediente por animal", "Ingesta por API o captura a mano"]}
            cta="Empezar"
            href="/dashboard"
          />
          <Tier
            name="Profesional"
            price={`$${PLANS.pro.priceMxn.toLocaleString("es-MX")}`}
            period="MXN / mes"
            limit="Hasta 500 animales"
            features={["Todo lo de Inicial", "Equipo y roles (vet, gerente, cuidador)", "Integraciones y API de ingesta", "IA por imagen", "Soporte prioritario"]}
            cta="Empezar"
            href="/dashboard"
            featured
          />
          <Tier
            name="Empresa"
            price="A tu medida"
            period=""
            limit="Animales ilimitados"
            features={["Todo lo de Profesional", "Multi-sitio y cooperativas", "Integraciones a la medida", "SLA y gerente de cuenta"]}
            cta="Hablemos"
            href="#precios"
          />
        </div>
        <p className="text-center text-[12.5px] mt-7" style={{ color: "var(--faint)" }}>Precios en MXN — también disponibles en tu divisa. La facturación se activa al conectar tu rancho de verdad.</p>
      </section>

      {/* Waitlist */}
      <section className="max-w-[1100px] mx-auto px-6 pb-20">
        <div
          className="rounded-[28px] border p-9 md:p-12 text-center shadow-[0_24px_60px_-34px_rgba(58,90,64,0.4)]"
          style={{ borderColor: "var(--border)", background: "linear-gradient(160deg,#f6f7ef,#eceee2)" }}
        >
          <h2 className="font-sora text-[26px] md:text-[30px] font-semibold tracking-tight">Cuando esté listo para tu rancho</h2>
          <p className="text-[15px] mt-3 mb-7 max-w-[520px] mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
            HerdFlow está en construcción. Déjanos tu correo y te avisamos en cuanto puedas conectar tu hato de verdad.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-3 text-[13px]" style={{ color: "var(--muted)" }}>
          <div className="flex items-center gap-2.5">
            <BrandMark size={24} />
            <span>HerdFlow — salud predictiva del ganado · Construyendo en público</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/frisonialessia/Herdflow" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-[var(--ink)]">
              <Github size={14} strokeWidth={2} /> Ver código
            </a>
            <span style={{ color: "var(--faint)" }}>Datos sintéticos · demostración</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHead({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="text-center max-w-[640px] mx-auto mb-10 md:mb-12">
      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] mb-2.5" style={{ color: "var(--sage)" }}>{kicker}</div>
      <h2 className="font-sora text-[28px] md:text-[34px] font-semibold tracking-tight leading-[1.1]">{title}</h2>
      <p className="text-[15.5px] mt-3.5 leading-relaxed" style={{ color: "var(--muted)" }}>{children}</p>
    </div>
  );
}

function Stat({ k, label }: { k: string; label: string }) {
  return (
    <div className="bg-white px-5 py-5 text-center">
      <div className="font-sora text-[26px] font-semibold tracking-tight" style={{ color: "var(--sage-deep)" }}>{k}</div>
      <div className="text-[12.5px] mt-1 leading-snug" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className={`${CARD} p-6 text-left`} style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-sora text-[14px] font-semibold text-white" style={{ background: "var(--sage-deep)" }}>{n}</div>
        <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ background: "var(--card-soft)" }}>{icon}</div>
      </div>
      <h3 className="font-sora text-[16.5px] font-semibold">{title}</h3>
      <p className="text-[14px] mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className={`${CARD} p-6 text-left`} style={{ borderColor: "var(--border)" }}>
      <div className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4" style={{ background: "var(--card-soft)" }}>{icon}</div>
      <h3 className="font-sora text-[17px] font-semibold">{title}</h3>
      <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}

function Detect({ cond, signal, how }: { cond: string; signal: string; how: string }) {
  return (
    <div className={`${CARD} p-5 text-left`} style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h3 className="font-sora text-[15px] font-semibold">{cond}</h3>
        <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-[20px] whitespace-nowrap shrink-0" style={{ background: "var(--brown-soft)", color: "var(--brown)" }}>{signal}</span>
      </div>
      <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{how}</p>
    </div>
  );
}

function Tier({ name, price, period, limit, features, cta, href, featured }: { name: string; price: string; period: string; limit: string; features: string[]; cta: string; href: string; featured?: boolean }) {
  return (
    <div
      className="rounded-xl2 border p-7 flex flex-col"
      style={featured
        ? { borderColor: "var(--sage-deep)", background: "linear-gradient(160deg,#f6f7ef,#ffffff)", boxShadow: "0 24px 60px -34px rgba(58,90,64,0.4)" }
        : { borderColor: "var(--border)", background: "#fff", boxShadow: "0 10px 30px -20px rgba(58,90,64,0.18)" }}
    >
      {featured && (
        <span className="self-start text-[10.5px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px] text-white mb-3" style={{ background: "var(--sage-deep)" }}>Más popular</span>
      )}
      <h3 className="font-sora text-[18px] font-semibold">{name}</h3>
      <div className="flex items-baseline gap-1.5 mt-2">
        <span className="font-sora text-[30px] font-semibold tracking-tight">{price}</span>
        {period && <span className="text-[13px]" style={{ color: "var(--muted)" }}>{period}</span>}
      </div>
      <div className="text-[13px] mt-1 font-semibold" style={{ color: "var(--sage-deep)" }}>{limit}</div>
      <ul className="flex flex-col gap-2.5 mt-5 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13.5px]" style={{ color: "var(--ink)" }}>
            <Check size={15} strokeWidth={2.5} color="var(--sage-deep)" className="mt-0.5 shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-auto text-center rounded-[30px] px-5 py-2.5 text-sm font-medium border transition-all duration-200 hover:-translate-y-[1px]"
        style={featured ? { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" } : { background: "var(--card-soft)", color: "var(--ink)", borderColor: "var(--border)" }}
      >
        {cta}
      </Link>
    </div>
  );
}
