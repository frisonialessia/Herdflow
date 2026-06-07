"use client";

// Current role. In real mode it comes from the server (the user's membership)
// and is locked. In demo mode it's a previewable switcher persisted to
// localStorage. Either way the UI reads it via useRole(); the server actions
// re-check the real role independently.

import { createContext, useContext, useEffect, useState } from "react";
import { Role, isRole } from "@/lib/roles";

const Ctx = createContext<{ role: Role; setRole: (r: Role) => void; locked: boolean } | null>(null);
const KEY = "hf-role";

export function RoleProvider({ children, serverRole, locked = false }: { children: React.ReactNode; serverRole?: Role | null; locked?: boolean }) {
  const [role, setRoleState] = useState<Role>(serverRole ?? "owner");

  useEffect(() => {
    if (locked) return; // real mode: role is fixed by the membership
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (isRole(stored)) setRoleState(stored);
  }, [locked]);

  const setRole = (r: Role) => {
    if (locked) return;
    setRoleState(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ role, setRole, locked }}>{children}</Ctx.Provider>;
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>");
  return ctx;
}
