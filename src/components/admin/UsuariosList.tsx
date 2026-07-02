"use client";

import { Fragment, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Profile, UserStatus } from "@/lib/types";
import { BRANCHES } from "@/lib/account";
import UserControls from "@/components/admin/UserControls";
import ResetPasswordButton from "@/components/admin/ResetPasswordButton";

// Arma el listado de aprobados agrupado por sucursal, formateado para WhatsApp
// (sucursal en negrita con *asteriscos*). Excluye a los super_admin.
function buildWhatsappText(list: Profile[]): string {
  const participantes = list.filter((u) => u.role !== "super_admin");
  const byBranch = new Map<string, string[]>();
  for (const u of participantes) {
    const branch = u.branch || "Sin sucursal";
    if (!byBranch.has(branch)) byBranch.set(branch, []);
    byBranch.get(branch)!.push(u.full_name || "—");
  }
  const order: string[] = [...BRANCHES, "Sin sucursal"];
  const branches = Array.from(byBranch.keys()).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  const parts: string[] = [`*Total: ${participantes.length} participantes*`, ""];
  for (const branch of branches) {
    const names = byBranch.get(branch)!.sort((a, b) => a.localeCompare(b));
    parts.push(`*${branch}* (${names.length})`);
    names.forEach((n, i) => parts.push(`${i + 1}. ${n}`));
    parts.push("");
  }
  return parts.join("\n").trim();
}

const STATUS_BADGE: Record<string, string> = {
  aprobado: "bg-brandsoft text-brand",
  pendiente: "bg-amber-500/15 text-amber-600",
  rechazado: "bg-red-500/15 text-red-500",
};

type Tab = UserStatus;

function Ficha({ u }: { u: Profile }) {
  const rows: [string, string | null][] = [
    ["Nick / apodo", u.full_name || null],
    ["Correo", u.email || null],
    ["Sucursal", u.branch],
  ];
  return (
    <>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-line/60 py-1">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">
        Los datos personales y laborales completos están en el panel de RRHH (relevamiento).
      </p>
    </>
  );
}

export default function UsuariosList({
  users,
  meId,
  canManageRoles,
}: {
  users: Profile[];
  meId: string;
  canManageRoles: boolean;
}) {
  const groups: Record<Tab, Profile[]> = {
    pendiente: users.filter((u) => u.status === "pendiente"),
    aprobado: users.filter((u) => u.status === "aprobado"),
    rechazado: users.filter((u) => u.status === "rechazado"),
  };

  const [tab, setTab] = useState<Tab>(
    groups.pendiente.length > 0 ? "pendiente" : "aprobado",
  );
  const [openFicha, setOpenFicha] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyAprobados() {
    const text = buildWhatsappText(groups.aprobado);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const hayParaCopiar = groups.aprobado.some((u) => u.role !== "super_admin");

  const tabs: { key: Tab; label: string }[] = [
    { key: "pendiente", label: "Pendientes" },
    { key: "aprobado", label: "Aprobados" },
    { key: "rechazado", label: "Rechazados" },
  ];

  const list = groups[tab];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex min-w-0 overflow-x-auto rounded-xl border border-line bg-elevated/50 p-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition sm:gap-1.5 sm:px-3 sm:text-sm ${
                active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
              <span
                className={`badge ${
                  active ? "bg-brandsoft text-brand" : "bg-elevated text-muted"
                }`}
              >
                {groups[t.key].length}
              </span>
            </button>
          );
        })}
        </div>
        {tab === "aprobado" && canManageRoles && hayParaCopiar && (
          <button
            type="button"
            onClick={copyAprobados}
            title="Copiar aprobados por ciudad (WhatsApp)"
            aria-label="Copiar aprobados por ciudad"
            className="shrink-0 rounded-lg border border-line p-2 text-muted transition hover:bg-elevated hover:text-fg"
          >
            {copied ? (
              <Check size={18} className="text-brand" />
            ) : (
              <Copy size={18} />
            )}
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-muted">No hay usuarios en esta sección.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elevated/60 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((u) => {
                const open = openFicha === u.id;
                return (
                  <Fragment key={u.id}>
                    <tr className="hover:bg-hover">
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          <span className="mr-1.5 text-lg">{u.emoji}</span>
                          {u.full_name || "—"}
                        </div>
                        <button
                          onClick={() => setOpenFicha(open ? null : u.id)}
                          className="mt-0.5 text-xs font-medium text-brand hover:underline"
                        >
                          {open ? "Ocultar ficha" : "Ver ficha"}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`badge ${STATUS_BADGE[u.status]}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-2">
                          <UserControls
                            userId={u.id}
                            status={u.status}
                            role={u.role}
                            isSelf={u.id === meId}
                            canManageRoles={canManageRoles}
                          />
                          {canManageRoles && u.role !== "super_admin" && (
                            <ResetPasswordButton userId={u.id} />
                          )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-elevated/40">
                        <td colSpan={3} className="px-3 py-3">
                          <Ficha u={u} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
