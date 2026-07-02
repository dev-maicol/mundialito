"use client";

import { Fragment, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import type { Profile, UserStatus } from "@/lib/types";
import { BRANCHES } from "@/lib/account";
import UserControls from "@/components/admin/UserControls";
import ResetPasswordButton from "@/components/admin/ResetPasswordButton";

// Agrupa los participantes (sin super_admin) por sucursal, con las sucursales
// ordenadas según BRANCHES y los nombres alfabéticos dentro de cada una.
function groupByBranch(list: Profile[]): { total: number; branches: [string, string[]][] } {
  const participantes = list.filter((u) => u.role !== "super_admin");
  const byBranch = new Map<string, string[]>();
  for (const u of participantes) {
    const branch = u.branch || "Sin sucursal";
    if (!byBranch.has(branch)) byBranch.set(branch, []);
    byBranch.get(branch)!.push(u.full_name || "—");
  }
  const order: string[] = [...BRANCHES, "Sin sucursal"];
  const branches = Array.from(byBranch.keys())
    .sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    })
    .map((branch) => [branch, byBranch.get(branch)!.sort((a, b) => a.localeCompare(b))] as [string, string[]]);
  return { total: participantes.length, branches };
}

// Listado completo agrupado por sucursal (sucursal en negrita con *asteriscos*).
function buildWhatsappText(list: Profile[]): string {
  const { total, branches } = groupByBranch(list);
  const parts: string[] = [`*Total: ${total} participantes*`, ""];
  for (const [branch, names] of branches) {
    parts.push(`*${branch}* (${names.length})`);
    names.forEach((n, i) => parts.push(`${i + 1}. ${n}`));
    parts.push("");
  }
  return parts.join("\n").trim();
}

// Listado de una sola sucursal.
function buildBranchText(list: Profile[], branch: string): string {
  const match = groupByBranch(list).branches.find(([b]) => b === branch);
  const names = match?.[1] ?? [];
  const parts: string[] = [`*${branch}* (${names.length})`];
  names.forEach((n, i) => parts.push(`${i + 1}. ${n}`));
  return parts.join("\n").trim();
}

// Solo los totales: conteo por sucursal + total general, sin nombres.
function buildTotalsText(list: Profile[]): string {
  const { total, branches } = groupByBranch(list);
  const parts: string[] = [`*Total: ${total} participantes*`, ""];
  for (const [branch, names] of branches) {
    parts.push(`*${branch}*: ${names.length}`);
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
  const [menuOpen, setMenuOpen] = useState(false);
  // Guarda qué opción se copió (para el ✓ momentáneo), o null.
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      setCopiedKey(null);
    }
    setMenuOpen(false);
  }

  const { branches: approvedBranches } = groupByBranch(groups.aprobado);
  const hayParaCopiar = approvedBranches.length > 0;

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
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              title="Copiar para WhatsApp"
              aria-label="Opciones de copia para WhatsApp"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-1 rounded-lg border border-line p-2 text-muted transition hover:bg-elevated hover:text-fg"
            >
              {copiedKey ? (
                <Check size={18} className="text-brand" />
              ) : (
                <Copy size={18} />
              )}
              <ChevronDown size={14} />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop para cerrar al hacer clic afuera */}
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 max-h-80 w-60 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-lg"
                >
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => copy("all", buildWhatsappText(groups.aprobado))}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-elevated"
                  >
                    Todos (por sucursal)
                    {copiedKey === "all" && <Check size={16} className="text-brand" />}
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => copy("totals", buildTotalsText(groups.aprobado))}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-elevated"
                  >
                    Solo totales
                    {copiedKey === "totals" && <Check size={16} className="text-brand" />}
                  </button>

                  <div className="my-1 border-t border-line" />
                  <p className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted">
                    Por sucursal
                  </p>
                  {approvedBranches.map(([branch, names]) => (
                    <button
                      key={branch}
                      role="menuitem"
                      type="button"
                      onClick={() => copy(`branch:${branch}`, buildBranchText(groups.aprobado, branch))}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-elevated"
                    >
                      <span className="truncate">
                        {branch} <span className="text-muted">({names.length})</span>
                      </span>
                      {copiedKey === `branch:${branch}` && (
                        <Check size={16} className="shrink-0 text-brand" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
