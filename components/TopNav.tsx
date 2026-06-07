"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User, Menu, X, Settings, LogOut } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { SettingsModal } from "@/components/SettingsModal";
import { signOut as signOutAction } from "@/app/auth/actions";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/live", label: "Live Monitoring" },
  { href: "/dashboard/animals", label: "Animals" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/impact", label: "Impact" },
];

export function TopNav() {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isActive = (href: string) => (href === "/dashboard" ? path === "/dashboard" : path.startsWith(href));
  const openSettings = () => { setSettingsOpen(true); setUserOpen(false); setMobileOpen(false); };
  const signOut = () => { setUserOpen(false); setMobileOpen(false); void signOutAction(); };

  return (
    <>
      <nav className="relative flex items-center justify-between mb-7">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={34} />
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
            <IconCircle ariaLabel="Search"><Search size={18} strokeWidth={2} color="var(--sage-deep)" /></IconCircle>
            <IconCircle ariaLabel="Notifications">
              <Bell size={18} strokeWidth={2} color="var(--sage-deep)" />
              <span className="absolute top-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-white" style={{ background: "var(--critical)" }} />
            </IconCircle>

            <div className="relative">
              <button
                onClick={() => setUserOpen((o) => !o)}
                aria-label="User menu"
                className="w-[38px] h-[38px] rounded-full bg-white border flex items-center justify-center cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                <User size={18} strokeWidth={2} color="var(--sage-deep)" />
              </button>
              {userOpen && (
                <div
                  className="absolute right-0 top-full mt-2 z-30 rounded-2xl border bg-white p-2 min-w-[180px]"
                  style={{ borderColor: "var(--border)", boxShadow: "0 20px 40px -16px rgba(58,90,64,0.35)" }}
                >
                  <MenuItem onClick={openSettings} icon={<Settings size={16} strokeWidth={2} />} label="Settings" />
                  <MenuItem onClick={signOut} icon={<LogOut size={16} strokeWidth={2} />} label="Sign out" tone="brown" />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="md:hidden w-[40px] h-[40px] rounded-full bg-white border flex items-center justify-center cursor-pointer"
            style={{ borderColor: "var(--border)" }}
          >
            {mobileOpen ? <X size={18} strokeWidth={2} color="var(--sage-deep)" /> : <Menu size={18} strokeWidth={2} color="var(--sage-deep)" />}
          </button>
        </div>

        {mobileOpen && (
          <div
            className="md:hidden absolute top-full right-0 mt-2 z-30 rounded-2xl border bg-white p-2 min-w-[210px]"
            style={{ borderColor: "var(--border)", boxShadow: "0 20px 40px -16px rgba(58,90,64,0.35)" }}
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm transition-colors"
                style={isActive(l.href) ? { background: "var(--card-soft)", color: "var(--sage-deep)", fontWeight: 600 } : { color: "var(--ink)" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t my-1.5" style={{ borderColor: "var(--border)" }} />
            <MenuItem onClick={openSettings} icon={<Settings size={16} strokeWidth={2} />} label="Settings" />
            <MenuItem onClick={signOut} icon={<LogOut size={16} strokeWidth={2} />} label="Sign out" tone="brown" />
          </div>
        )}
      </nav>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

function IconCircle({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <div
      aria-label={ariaLabel}
      className="w-[38px] h-[38px] rounded-full bg-white border flex items-center justify-center cursor-pointer relative"
      style={{ borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}

function MenuItem({ onClick, icon, label, tone }: { onClick: () => void; icon: React.ReactNode; label: string; tone?: "brown" }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm cursor-pointer bg-transparent border-0 hover:bg-[var(--card-soft)] transition-colors"
      style={{ color: tone === "brown" ? "var(--brown)" : "var(--ink)" }}
    >
      {icon} {label}
    </button>
  );
}
