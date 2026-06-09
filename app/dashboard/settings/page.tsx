"use client";

// Owner-only team & roles settings. Invite teammates by email with a role, change
// roles, remove members, and see the complete capability map of every role. In
// the demo the roster lives in memory (so it's fully clickable); in real mode the
// same actions will hit the DB-backed invitations layer when Supabase is wired —
// the UI doesn't change. Gated by the manageTeam capability (owner).

import { useState } from "react";
import { useRole } from "@/components/RoleProvider";
import { ROLE_ICON } from "@/components/RoleSwitcher";
import { can, ROLE_ORDER, ROLE_LABEL, ROLE_DESC, ROLE_COLOR, capabilitiesOf, CAPABILITY_LABEL, type Role } from "@/lib/roles";
import { NoAccess } from "@/components/NoAccess";
import { Users, UserPlus, Mail, Shield, Trash2, Check, Clock, X, Settings as Cog } from "lucide-react";

interface Member { id: string; name: string; email: string; role: Role; you?: boolean }
interface Invite { id: string; email: string; role: Role }

const SEED_MEMBERS: Member[] = [
  { id: "u-you", name: "Tú", email: "tu-correo@rancho.mx", role: "owner", you: true },
  { id: "u-vet", name: "Dra. Ana Reyes", email: "ana.reyes@rancho.mx", role: "vet" },
  { id: "u-herd", name: "Miguel Ortiz", email: "miguel.ortiz@rancho.mx", role: "herdsman" },
  { id: "u-mgr", name: "Laura Méndez", email: "laura.mendez@rancho.mx", role: "manager" },
  { id: "u-view", name: "Pedro Sánchez", email: "pedro.sanchez@rancho.mx", role: "viewer" },
];
const SEED_INVITES: Invite[] = [{ id: "i-seed", email: "nuevo.cuidador@rancho.mx", role: "herdsman" }];

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function SettingsPage() {
  const { role } = useRole();
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [invites, setInvites] = useState<Invite[]>(SEED_INVITES);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("herdsman");
  const [error, setError] = useState("");

  if (!can(role, "manageTeam")) return <NoAccess feature="Configuración del equipo" />;

  function invite() {
    const e = email.trim().toLowerCase();
    if (!emailOk(e)) { setError("Correo no válido"); return; }
    if (members.some((m) => m.email === e) || invites.some((i) => i.email === e)) { setError("Ya está en el equipo o invitado"); return; }
    setInvites((prev) => [{ id: `i-${Date.now()}`, email: e, role: inviteRole }, ...prev]);
    setEmail(""); setError("");
  }

  return (
    <section className="animate-fade">
      <div className="mb-[22px]">
        <h2 className="font-sora text-[26px] font-semibold tracking-tight flex items-center gap-2.5">
          <Cog size={24} strokeWidth={2} color="var(--sage-deep)" /> Configuración
        </h2>
        <div className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
          Equipo, invitaciones y permisos de tu rancho
        </div>
      </div>

      {/* Invite */}
      <div className="bg-white border rounded-xl2 p-[22px] mb-[18px]" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <UserPlus size={16} strokeWidth={2} color="var(--sage-deep)" />
          <h3 className="font-sora text-base font-semibold">Invitar al equipo</h3>
        </div>
        <p className="text-[13px] mb-3.5" style={{ color: "var(--muted)" }}>
          La persona recibe un enlace y entra a <b>este rancho</b> con el rol que elijas.
        </p>
        <div className="flex gap-2.5 flex-wrap items-start">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-2.5" style={{ borderColor: error ? "var(--critical)" : "var(--border)", background: "var(--card-soft)" }}>
              <Mail size={15} strokeWidth={2} color="var(--faint)" />
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && invite()}
                placeholder="correo@rancho.mx"
                className="bg-transparent outline-none text-[13.5px] flex-1"
              />
            </div>
            {error && <div className="text-[11.5px] mt-1" style={{ color: "var(--critical)" }}>{error}</div>}
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className="border rounded-xl px-3 py-2.5 text-[13.5px] cursor-pointer"
            style={{ borderColor: "var(--border)", background: "#fff", color: "var(--ink)" }}
          >
            {ROLE_ORDER.filter((r) => r !== "owner").map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <button onClick={invite} className="text-white border-0 rounded-xl px-4 py-2.5 text-[13.5px] font-medium cursor-pointer flex items-center gap-2" style={{ background: "var(--sage-deep)" }}>
            <UserPlus size={15} strokeWidth={2} color="#fff" /> Invitar
          </button>
        </div>
        <div className="text-[11.5px] mt-3 pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--faint)" }}>
          Demo: las invitaciones viven en esta sesión. Al conectar la base, el enlace de acceso y la membresía se guardan de verdad.
        </div>
      </div>

      {/* Members */}
      <div className="bg-white border rounded-xl2 p-[22px] mb-[18px]" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} strokeWidth={2} color="var(--sage-deep)" />
          <h3 className="font-sora text-base font-semibold">Miembros</h3>
          <span className="text-[12px] rounded-[20px] px-2 font-semibold" style={{ background: "var(--card-soft)", color: "var(--muted)" }}>{members.length}</span>
        </div>

        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" style={{ borderColor: "var(--border)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0" style={{ background: ROLE_COLOR[m.role] }}>
                {initials(m.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold flex items-center gap-2">
                  {m.name} {m.you && <span className="text-[10px] font-semibold px-1.5 py-[1px] rounded-[20px]" style={{ background: "var(--sage-light)", color: "var(--sage-deep)" }}>tú</span>}
                </div>
                <div className="text-[12px] truncate" style={{ color: "var(--muted)" }}>{m.email}</div>
              </div>
              {m.you ? (
                <RoleBadge role={m.role} />
              ) : (
                <select
                  value={m.role}
                  onChange={(e) => setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role: e.target.value as Role } : x)))}
                  className="border rounded-[20px] px-2.5 py-1.5 text-[12px] cursor-pointer font-medium"
                  style={{ borderColor: "var(--border)", background: "#fff", color: ROLE_COLOR[m.role] }}
                >
                  {ROLE_ORDER.map((r) => <option key={r} value={r} style={{ color: "var(--ink)" }}>{ROLE_LABEL[r]}</option>)}
                </select>
              )}
              {!m.you && (
                <button onClick={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))} title="Quitar del equipo" className="w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer shrink-0" style={{ borderColor: "var(--border)" }}>
                  <Trash2 size={14} strokeWidth={2} color="var(--brown)" />
                </button>
              )}
            </div>
          ))}
        </div>

        {invites.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-2.5" style={{ color: "var(--faint)" }}>Invitaciones pendientes</div>
            <div className="flex flex-col gap-2">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--card-soft)" }}>
                  <Clock size={15} strokeWidth={2} color="var(--watch)" className="shrink-0" />
                  <div className="min-w-0 flex-1 text-[13px] truncate">{i.email}</div>
                  <RoleBadge role={i.role} />
                  <button onClick={() => setInvites((prev) => prev.filter((x) => x.id !== i.id))} title="Cancelar invitación" className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shrink-0" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                    <X size={13} strokeWidth={2} color="var(--brown)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role catalog */}
      <div className="flex items-center gap-2 mb-3.5">
        <Shield size={18} strokeWidth={2} color="var(--sage-deep)" />
        <h3 className="font-sora text-[17px] font-semibold">Roles y permisos</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {ROLE_ORDER.map((r) => {
          const Icon = ROLE_ICON[r];
          const caps = capabilitiesOf(r);
          return (
            <div key={r} className="bg-white border rounded-[16px] p-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: ROLE_COLOR[r] }}>
                  <Icon size={17} strokeWidth={2.2} color="#fff" />
                </div>
                <div>
                  <div className="font-semibold text-[14.5px]">{ROLE_LABEL[r]}</div>
                  <div className="text-[12px]" style={{ color: "var(--muted)" }}>{ROLE_DESC[r]}</div>
                </div>
              </div>
              {caps.length === 0 ? (
                <div className="text-[12px] mt-2" style={{ color: "var(--faint)" }}>Solo lectura — ve todo, no modifica nada.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {caps.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 text-[11px] px-2 py-[2px] rounded-[20px]" style={{ background: "var(--card-soft)", color: "var(--ink)" }}>
                      <Check size={10} strokeWidth={3} color="var(--sage-deep)" /> {CAPABILITY_LABEL[c]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px] text-white shrink-0" style={{ background: ROLE_COLOR[role] }}>
      {ROLE_LABEL[role]}
    </span>
  );
}
