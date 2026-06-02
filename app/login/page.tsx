import { redirect } from "next/navigation";
import Link from "next/link";
import { Info, ArrowRight } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Demo mode: there's nothing to log into — point people at the live dashboard.
  if (!isSupabaseConfigured()) {
    return (
      <section className="animate-fade max-w-[460px] mx-auto mt-12">
        <div className="bg-white border rounded-xl2 p-8" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "var(--card-soft)" }}>
              <Info size={18} strokeWidth={2} color="var(--sage-deep)" />
            </div>
            <h2 className="font-sora text-[20px] font-semibold">Demo mode</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            HerdFlow is running on synthetic data, so accounts are inactive. Add your
            Supabase keys to{" "}
            <code className="px-1 rounded" style={{ background: "var(--card-soft)" }}>.env.local</code>{" "}
            to enable email sign-in.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 text-white border-0 rounded-[30px] px-5 py-[11px] text-sm font-medium"
            style={{ background: "var(--sage-deep)" }}
          >
            Open the dashboard <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </section>
    );
  }

  // Already signed in → straight to the dashboard.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <section className="animate-fade max-w-[460px] mx-auto mt-12">
      <LoginForm invalidLink={searchParams.error === "link_invalid"} />
    </section>
  );
}
