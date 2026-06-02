"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User, Menu, X } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/live", label: "Live Monitoring" },
  { href: "/dashboard/animals", label: "Animals" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/impact", label: "Impact" },
];

export function TopNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/dashboard" ? path === "/dashboard" : path.startsWith(href));

  return (
    <nav className="relative flex items-center justify-between mb-7">
      <Link href="/" className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full animate-spin-slow"
          style={{
            background: "conic-gradient(from 120deg, var(--sage-light), var(--sage), var(--sage-deep), var(--sage-light))",
            boxShadow: "0 0 16px rgba(88,129,87,0.45)",
          }}
        />
        <h1 className="font-sora text-xl font-bold tracking-tight">
          Herd<span style={{ color: "var(--sage)" }}>Flow</span>
        </h1>
      </Link>

      <div className="hidden md:flex gap-1 p-1.5 rounded-full" style={{ background: "var(--sage-deep)" }}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm px-[18px] py-2 rounded-[30px] transition-colors"
            style={isActive(l.href) ? { background: "var(--sage-light)", color: "var(--sage-deep)", fontWeight: 600 } : { color: "#cdd6c7" }}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex gap-2.5 items-center">
          {[Search, Bell, User].map((Icon, i) => (
            <div
              key={i}
              className="w-[38px] h-[38px] rounded-full bg-white border flex items-center justify-center cursor-pointer relative"
              style={{ borderColor: "var(--border)" }}
            >
              <Icon size={18} strokeWidth={2} color="var(--sage-deep)" />
              {i === 1 && (
                <span className="absolute top-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-white" style={{ background: "var(--critical)" }} />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="md:hidden w-[40px] h-[40px] rounded-full bg-white border flex items-center justify-center cursor-pointer"
          style={{ borderColor: "var(--border)" }}
        >
          {open ? <X size={18} strokeWidth={2} color="var(--sage-deep)" /> : <Menu size={18} strokeWidth={2} color="var(--sage-deep)" />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden absolute top-full right-0 mt-2 z-30 rounded-2xl border bg-white p-2 min-w-[210px]"
          style={{ borderColor: "var(--border)", boxShadow: "0 20px 40px -16px rgba(58,90,64,0.35)" }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm transition-colors"
              style={isActive(l.href) ? { background: "var(--card-soft)", color: "var(--sage-deep)", fontWeight: 600 } : { color: "var(--ink)" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
