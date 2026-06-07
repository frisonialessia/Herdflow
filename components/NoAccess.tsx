"use client";

import { Lock } from "lucide-react";
import { ROLE_LABEL } from "@/lib/roles";
import { useRole } from "@/components/RoleProvider";

export function NoAccess({ feature }: { feature: string }) {
  const { role } = useRole();
  return (
    <section className="animate-fade">
      <div className="bg-white border rounded-xl2 text-center py-16 px-6" style={{ borderColor: "var(--border)" }}>
        <div className="w-12 h-12 rounded-[14px] mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--card-soft)" }}>
          <Lock size={22} strokeWidth={2} color="var(--brown)" />
        </div>
        <div className="font-sora text-[18px] font-semibold">Sin acceso</div>
        <div className="text-[13px] mt-1.5 max-w-[400px] mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
          <b>{feature}</b> solo está disponible para el rol <b>Dueño</b>. Estás viendo como <b>{ROLE_LABEL[role]}</b> — cámbialo arriba a la derecha.
        </div>
      </div>
    </section>
  );
}
