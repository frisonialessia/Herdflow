"use client";

// Scrollable centered modal used by the add/edit animal forms. Sits above the
// drawer (z-60) so editing works from within an open animal.

import { X } from "lucide-react";

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(35,44,34,0.45)" }} onClick={onClose} />
      <div
        className="relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto bg-white border rounded-xl2 p-6"
        style={{ borderColor: "var(--border)", boxShadow: "0 30px 60px -20px rgba(58,90,64,0.5)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sora text-[18px] font-semibold">{title}</h3>
          <button onClick={onClose} title="Cerrar" className="cursor-pointer bg-transparent border-0 p-0">
            <X size={18} strokeWidth={2} color="var(--muted)" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
