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
        <h1 className="font-sora text-[22px] font-semibold tracking-tight">Sign in to HerdFlow</h1>

        {demoMode ? (
          <div>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
              Running in demo mode (no database) — no sign-in needed.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 text-white rounded-[30px] px-5 py-2.5 text-sm font-medium"
              style={{ background: "var(--sage-deep)" }}
            >
              Open the dashboard
            </Link>
          </div>
        ) : (
          <form action={login} className="mt-6">
            <label className="text-[12px] uppercase tracking-wide font-semibold" style={{ color: "var(--faint)" }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@farm.com"
              className="w-full border rounded-xl px-3.5 py-3 mt-1.5 text-sm outline-none"
              style={{ background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
            />
            {searchParams.error === "notfound" && (
              <p className="text-[13px] mt-2" style={{ color: "var(--critical)" }}>No account for that email.</p>
            )}
            <button
              type="submit"
              className="w-full text-white rounded-[30px] px-5 py-3 text-sm font-medium mt-4 cursor-pointer"
              style={{ background: "var(--sage-deep)" }}
            >
              Continue
            </button>
            <p className="text-[12px] mt-4 leading-relaxed" style={{ color: "var(--faint)" }}>
              Dev login (passwordless). Seeded user: <code>demo@herdflow.app</code>. Add a password / magic-link for production.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
