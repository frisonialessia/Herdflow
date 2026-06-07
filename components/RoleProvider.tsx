"use client";

// Current role (persisted to localStorage so a previewed role survives reloads).
// Demo-only switcher; in production this comes from the authenticated user.

import { createContext, useContext, useEffect, useState } from "react";
import { Role, isRole } from "@/lib/roles";

const Ctx = createContext<{ role: Role; setRole: (r: Role) => void } | null>(null);
const KEY = "hf-role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("owner");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (isRole(stored)) setRoleState(stored);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>");
  return ctx;
}
