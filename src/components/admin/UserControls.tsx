"use client";

import { useTransition, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { setUserStatus, setUserRole } from "@/app/(app)/admin/actions";
import type { UserRole, UserStatus } from "@/lib/types";
import Portal from "@/components/Portal";

const ROLE_LABEL: Record<UserRole, string> = {
  apostador: "participante",
  gerencia: "gerencia",
  admin: "admin",
  super_admin: "super_admin",
};

export default function UserControls({
  userId,
  status,
  role,
  isSelf,
  canManageRoles,
}: {
  userId: string;
  status: UserStatus;
  role: UserRole;
  isSelf: boolean;
  canManageRoles: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  // Un admin común no puede actuar sobre super_admins (lo bloquea la RLS).
  const lockedTarget = !canManageRoles && role === "super_admin";

  if (lockedTarget) {
    return <span className="text-xs text-faint">—</span>;
  }

  function changeStatus(next: UserStatus) {
    setError(null);
    startTransition(async () => {
      const res = await setUserStatus(userId, next);
      if (!res.ok) setError(res.error);
    });
  }

  function confirmRole() {
    if (!pendingRole) return;
    const next = pendingRole;
    setError(null);
    startTransition(async () => {
      const res = await setUserRole(userId, next);
      setPendingRole(null);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "aprobado" && (
        <button
          onClick={() => changeStatus("aprobado")}
          disabled={pending}
          className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Aprobar
        </button>
      )}
      {status !== "rechazado" && !isSelf && (
        <button
          onClick={() => changeStatus("rechazado")}
          disabled={pending}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Rechazar
        </button>
      )}
      {canManageRoles && (
        <select
          value={role}
          disabled={pending || isSelf}
          onChange={(e) => {
            const next = e.target.value as UserRole;
            if (next !== role) setPendingRole(next);
          }}
          className="rounded border border-linestrong bg-elevated px-2 py-1 text-xs text-fg disabled:opacity-50"
        >
          <option value="apostador">participante</option>
          <option value="gerencia">gerencia</option>
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}

      <Portal>
        <AnimatePresence>
          {pendingRole && (
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !pending && setPendingRole(null)}
            >
              <motion.div
                className="card w-full max-w-xs p-5 text-center"
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold">Cambiar rol</h3>
                <p className="mt-2 text-sm text-muted">
                  ¿Cambiar el rol de este usuario a{" "}
                  <span className="font-semibold text-brand">
                    {ROLE_LABEL[pendingRole]}
                  </span>
                  ?
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setPendingRole(null)}
                    disabled={pending}
                    className="btn-ghost flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmRole}
                    disabled={pending}
                    className="btn-primary flex-1"
                  >
                    {pending ? "Cambiando…" : "Confirmar"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
