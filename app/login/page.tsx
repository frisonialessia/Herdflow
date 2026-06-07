import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/lib/auth/session";
import { login } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const demoMode = !process.env.DATABASE_URL;
  if (!demoMode && getSessionUserId()) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="bg-white border rounded-xl2 p-8 w-full max-w-[420px]" style={{ borderColor: "var(--border)" }}>
        <h1 className="font-sora text-[22px] font-semibold tracking-tight">Inicia sesión en HerdFlow</h1>

        {demoMode ? (
          <div>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
              Ejecutándose en modo demo (sin base de datos) — no se necesita iniciar sesión.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 text-white rounded-[30px] px-5 py-2.5 text-sm font-medium"
              style={{ background: "var(--sage-deep)" }}
            >
              Abrir el panel
            </Link>
          </div>
        ) : (
          <form action={login} className="mt-6">
            <label className="text-[12px] uppercase tracking-wide font-semibold" style={{ color: "var(--faint)" }}>
              Correo
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@rancho.com"
              className="w-full border rounded-xl px-3.5 py-3 mt-1.5 text-sm outline-none"
              style={{ background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
            />
            {searchParams.error === "notfound" && (
              <p className="text-[13px] mt-2" style={{ color: "var(--critical)" }}>No existe una cuenta para ese correo.</p>
            )}
            <button
              type="submit"
              className="w-full text-white rounded-[30px] px-5 py-3 text-sm font-medium mt-4 cursor-pointer"
              style={{ background: "var(--sage-deep)" }}
            >
              Continuar
            </button>
            <p className="text-[12px] mt-4 leading-relaxed" style={{ color: "var(--faint)" }}>
              Acceso de desarrollo (sin contraseña). Usuario de prueba: <code>demo@herdflow.app</code>. Agrega una contraseña o enlace mágico para producción.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
