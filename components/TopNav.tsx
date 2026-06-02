"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User, LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/live", label: "Live Monitoring" },
  { href: "/animals", label: "Animals" },
  { href: "/reports", label: "Reports" },
];

export function TopNav({ authed = false }: { authed?: boolean }) {
  const path = usePathname();
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/auth");

  const Brand = (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-full animate-spin-slow"
        style={{
          background:
            "conic-gradient(from 120deg, var(--sage-light), var(--sage), var(--sage-deep), var(--sage-light))",
          boxShadow: "0 0 16px rgba(88,129,87,0.45)",
        }}
      />
      <h1 className="font-sora text-xl font-bold tracking-tight">
        Herd<span style={{ color: "var(--sage)" }}>Flow</span>
      </h1>
    </div>
  );

  // Auth pages get a stripped-down bar — just the brand.
  if (isAuthRoute) {
    return <nav className="flex items-center mb-7">{Brand}</nav>;
  }

  return (
    <nav className="flex items-center justify-between mb-7">
      {Brand}

      <div
        className="hidden md:flex gap-1 p-1.5 rounded-full"
        style={{ background: "var(--sage-deep)" }}
      >
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-[18px] py-2 rounded-[30px] transition-colors"
              style={
                active
                  ? { background: "var(--sage-light)", color: "var(--sage-deep)", fontWeight: 600 }
                  : { color: "#cdd6c7" }
              }
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-2.5 items-center">
        <IconCircle>
          <Search size={18} strokeWidth={2} color="var(--sage-deep)" />
        </IconCircle>
        <IconCircle>
          <Bell size={18} strokeWidth={2} color="var(--sage-deep)" />
          <span
            className="absolute top-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-white"
            style={{ background: "var(--critical)" }}
          />
        </IconCircle>
        {authed ? (
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="w-[38px] h-[38px] rounded-full bg-white border flex items-center justify-center cursor-pointer"
              style={{ borderColor: "var(--border)" }}
            >
              <LogOut size={18} strokeWidth={2} color="var(--sage-deep)" />
            </button>
          </form>
        ) : (
          <IconCircle>
            <User size={18} strokeWidth={2} color="var(--sage-deep)" />
          </IconCircle>
        )}
      </div>
    </nav>
  );
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-[38px] h-[38px] rounded-full bg-white border flex items-center justify-center cursor-pointer relative"
      style={{ borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}
