"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Menu, X, Settings, LogOut, Cable } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { SettingsModal } from "@/components/SettingsModal";
import { NotificationsBell } from "@/components/NotificationsBell";
import { RoleSwitcher, ROLE_ICON } from "@/components/RoleSwitcher";
import { useRole } from "@/components/RoleProvider";
import { can, ROLE_ORDER, ROLE_LABEL, ROLE_COLOR } from "@/lib/roles";
import { signOut as signOutAction } from "@/app/auth/actions";

const LINKS: { href: string; label: string; finance?: boolean }[] = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/live", label: "Monitoreo en vivo" },
  { href: "/dashboard/animals", label: "Animales" },
  { href: "/dashboard/reports", label: "Reportes", finance: true },
  { href: "/dashboard/impact", label: "Impacto", finance: true },
];

export function TopNav() {
  const path = usePathname();
  const { role, setRole, locked } = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const links = LINKS.filter((l) => !l.finance || can(role, "finance"));

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
          {links.map((l) => (
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
            <RoleSwitcher />
            <IconCircle ariaLabel="Buscar"><Search size={18} strokeWidth={2} color="var(--sage-deep)" /></IconCircle>
            <NotificationsBell />

            <div className="relative">
              <button
                onClick={() => setUserOpen((o) => !o)}
                aria-label="Menú de usuario"
                className="w-[38px] h-[38px] rounded-full bg-white border flex items-center justify-center cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                <User size={18} strokeWidth={2} color="var(--sage-deep)" />
              </button>
              {userOpen && (
                <div
                  className="absolute right-0 top-full mt-2 z-30 rounded-2xl border bg-white p-2 min-w-[190px]"
                  style={{ borderColor: "var(--border)", boxShadow: "0 20px 40px -16px rgba(58,90,64,0.35)" }}
                >
                  {can(role, "integrations") && (
                    <Link href="/dashboard/integrations" onClick={() => setUserOpen(false)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-[var(--card-soft)] transition-colors" style={{ color: "var(--ink)" }}>
                      <Cable size={16} strokeWidth={2} /> Integraciones
                    </Link>
                  )}
                  <MenuItem onClick={openSettings} icon={<Settings size={16} strokeWidth={2} />} label="Ajustes" />
                  <MenuItem onClick={signOut} icon={<LogOut size={16} strokeWidth={2} />} label="Cerrar sesión" tone="brown" />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Abrir menú"
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
            <div className="text-[10px] uppercase tracking-wide font-semibold px-3 pt-1 pb-1.5" style={{ color: "var(--faint)" }}>{locked ? "Tu rol" : "Ver como"}</div>
            <div className="flex flex-col gap-1 px-2 pb-2">
              {(locked ? [role] : ROLE_ORDER).map((r) => {
                const RIcon = ROLE_ICON[r];
                const active = r === role;
                return (
                  <button
                    key={r}
                    onClick={() => { if (!locked) { setRole(r); setMobileOpen(false); } }}
                    className="flex items-center gap-2 py-2 px-2.5 rounded-xl border text-left cursor-pointer"
                    style={active ? { background: ROLE_COLOR[r], borderColor: ROLE_COLOR[r], color: "#fff" } : { background: "var(--card-soft)", borderColor: "var(--border)", color: "var(--ink)" }}
                  >
                    <RIcon size={15} strokeWidth={2.2} color={active ? "#fff" : ROLE_COLOR[r]} />
                    <span className="text-[12.5px] font-medium">{ROLE_LABEL[r]}</span>
                  </button>
                );
              })}
            </div>
            <div className="border-t my-1.5" style={{ borderColor: "var(--border)" }} />
            {links.map((l) => (
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
            {can(role, "integrations") && (
              <Link href="/dashboard/integrations" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-[var(--card-soft)] transition-colors" style={{ color: "var(--ink)" }}>
                <Cable size={16} strokeWidth={2} /> Integraciones
              </Link>
            )}
            <MenuItem onClick={openSettings} icon={<Settings size={16} strokeWidth={2} />} label="Ajustes" />
            <MenuItem onClick={signOut} icon={<LogOut size={16} strokeWidth={2} />} label="Cerrar sesión" tone="brown" />
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
