"use client";

import { useState } from "react";
import { ChevronDown, Inbox, LockOpen, RotateCcw, Users } from "lucide-react";
import { SECTIONS, type Field } from "@/lib/relevamiento";
import { reabrirFicha, liberarReclamo } from "@/app/(app)/rrhh/actions";
import type { Complaint, EmployeeAsset, EmployeeChild, EmployeeRecord } from "@/lib/types";

export type EmployeeFull = {
  record: EmployeeRecord;
  children: EmployeeChild[];
  assets: EmployeeAsset[];
  name: string;
  email: string;
  branch: string | null;
  emoji: string;
};

export type SubmissionRow = { user_id: string; submitted_at: string; name: string };

type Tab = "fichas" | "reclamos" | "envios";

export default function RrhhPanel({
  employees,
  complaints,
  submissions,
}: {
  employees: EmployeeFull[];
  complaints: Complaint[];
  submissions: SubmissionRow[];
}) {
  const [tab, setTab] = useState<Tab>("fichas");

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "fichas", label: "Fichas", icon: <Users size={16} />, count: employees.length },
    { id: "reclamos", label: "Reclamos", icon: <Inbox size={16} />, count: complaints.length },
    { id: "envios", label: "Envíos del buzón", icon: <LockOpen size={16} />, count: submissions.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "bg-brandsoft text-brand" : "bg-elevated text-muted hover:text-fg"
            }`}
          >
            {t.icon} {t.label} <span className="badge bg-surface">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "fichas" && <FichasTab employees={employees} />}
      {tab === "reclamos" && <ReclamosTab complaints={complaints} />}
      {tab === "envios" && <EnviosTab submissions={submissions} />}
    </div>
  );
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("es-BO", { dateStyle: "medium" });
}

function fieldValue(e: EmployeeFull, f: Field): string {
  if (f.store === "survey") return e.record.survey_answers?.[f.key] || "—";
  const raw = (e.record as unknown as Record<string, unknown>)[f.key];
  if (raw === null || raw === undefined || raw === "") return "—";
  if (typeof raw === "boolean") return raw ? "Sí" : "No";
  return String(raw);
}

function FichasTab({ employees }: { employees: EmployeeFull[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!employees.length)
    return <p className="text-sm text-muted">Todavía nadie completó su ficha.</p>;

  async function reopen(userId: string) {
    setBusy(userId);
    await reabrirFicha(userId);
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {employees.map((e) => {
        const isOpen = open === e.record.user_id;
        return (
          <div key={e.record.user_id} className="card overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : e.record.user_id)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="text-xl">{e.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{e.name}</div>
                <div className="truncate text-xs text-muted">
                  {e.record.department || "—"} · {e.email}
                </div>
              </div>
              <span className={`badge ${e.record.status === "finalizado" ? "bg-emerald-500/15 text-emerald-500" : "bg-elevated text-muted"}`}>
                {e.record.status}
              </span>
              <ChevronDown size={18} className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="border-t border-line p-4">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <Row label="Nick / apodo" value={e.name} />
                  <Row label="Correo" value={e.email} />
                  <Row label="Sucursal" value={e.branch || "—"} />
                </dl>

                {SECTIONS.map((s) => (
                  <div key={s.id} className="mt-4">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      {s.id}. {s.title}
                    </h4>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                      {s.fields.map((f) => {
                        if (f.kind === "children")
                          return (
                            <Row
                              key={f.key}
                              label="Hijos"
                              value={e.children.length ? e.children.map((c) => `${c.name} (${c.age})`).join(", ") : "—"}
                            />
                          );
                        if (f.kind === "assets")
                          return (
                            <div key={f.key} className="sm:col-span-2">
                              <dt className="text-muted">Equipos y bienes</dt>
                              <dd className="mt-0.5">
                                {e.assets.length ? (
                                  <ul className="list-disc pl-5">
                                    {e.assets.map((a, i) => (
                                      <li key={i}>
                                        {[a.kind, a.brand, a.model, a.serial].filter(Boolean).join(" · ")}
                                        {a.state ? ` — ${a.state}` : ""}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  "—"
                                )}
                              </dd>
                            </div>
                          );
                        return <Row key={f.key} label={f.label} value={fieldValue(e, f)} />;
                      })}
                    </dl>
                  </div>
                ))}

                {e.record.status === "finalizado" && (
                  <button
                    onClick={() => reopen(e.record.user_id)}
                    disabled={busy === e.record.user_id}
                    className="btn-ghost mt-4"
                  >
                    <RotateCcw size={16} /> {busy === e.record.user_id ? "Reabriendo…" : "Reabrir para corrección"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

function ReclamosTab({ complaints }: { complaints: Complaint[] }) {
  if (!complaints.length)
    return <p className="text-sm text-muted">No hay reclamos enviados.</p>;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">
        Reclamos anónimos. No es posible saber quién los envió.
      </p>
      {complaints.map((c) => (
        <div key={c.id} className="card p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="badge bg-brandsoft text-brand">{c.category || "Sin categoría"}</span>
            <span className="text-xs text-muted">{fmtDate(c.submitted_on)}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

function EnviosTab({ submissions }: { submissions: SubmissionRow[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!submissions.length)
    return <p className="text-sm text-muted">Nadie usó el buzón todavía.</p>;

  async function liberar(userId: string) {
    setBusy(userId);
    await liberarReclamo(userId);
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">
        Registro de quién usó el buzón (para el tope de 1 por persona). No revela el contenido.
        Liberar permite que esa persona envíe un reclamo nuevo.
      </p>
      {submissions.map((s) => (
        <div key={s.user_id} className="card flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{s.name}</div>
            <div className="text-xs text-muted">{fmtDate(s.submitted_at)}</div>
          </div>
          <button onClick={() => liberar(s.user_id)} disabled={busy === s.user_id} className="btn-ghost">
            <LockOpen size={16} /> {busy === s.user_id ? "…" : "Liberar"}
          </button>
        </div>
      ))}
    </div>
  );
}
