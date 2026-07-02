"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Plus, Trash2 } from "lucide-react";
import {
  SECTIONS,
  isFieldActive,
  type Field,
} from "@/lib/relevamiento";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { saveDraft, finalizeRecord } from "@/app/(app)/relevamiento/actions";
import type { EmployeeAsset, EmployeeChild, EmployeeRecord } from "@/lib/types";

type Props = {
  record: EmployeeRecord | null;
  childRows: EmployeeChild[];
  assets: EmployeeAsset[];
};

const ASSET_STATES = ["Bueno", "Regular", "Dañado", "Extraviado", "Pendiente de devolución"];

export default function RelevamientoWizard({ record, childRows: initialChildren, assets: initialAssets }: Props) {
  const locked = record?.status === "finalizado";

  // Estado del formulario.
  const [columns, setColumns] = useState<Record<string, string | boolean | null>>(() => {
    const base: Record<string, string | boolean | null> = {};
    for (const s of SECTIONS)
      for (const f of s.fields)
        if (f.store === "column") base[f.key] = (record as Record<string, unknown> | null)?.[f.key] as string | boolean | null ?? null;
    return base;
  });
  const [survey, setSurvey] = useState<Record<string, string>>(() => ({ ...(record?.survey_answers ?? {}) }));
  const [kids, setKids] = useState<EmployeeChild[]>(initialChildren);
  const [assets, setAssets] = useState<EmployeeAsset[]>(initialAssets);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<null | "draft" | "final">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Cambios sin guardar desde la última carga/guardado.
  const [dirty, setDirty] = useState(false);

  const section = SECTIONS[step];
  const allValues = useMemo(() => ({ ...columns, ...survey }), [columns, survey]);

  useUnsavedChangesWarning(
    dirty,
    "Tenés cambios sin guardar en tu ficha. Si salís ahora se perderán.\n\n¿Salir de todos modos?",
  );

  function setValue(f: Field, value: string | boolean | null) {
    setMsg(null);
    setDirty(true);
    if (f.store === "survey") {
      setSurvey((prev) => ({ ...prev, [f.key]: typeof value === "boolean" ? (value ? "Sí" : "No") : (value ?? "") }));
    } else {
      setColumns((prev) => ({ ...prev, [f.key]: value }));
    }
  }

  async function persist(kind: "draft" | "final") {
    setBusy(kind);
    setMsg(null);
    const payload = { columns, survey, children: kids, assets };
    const res = kind === "draft" ? await saveDraft(payload) : await finalizeRecord(payload);
    setBusy(null);
    if (!res.ok) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
    setDirty(false); // ya está persistido: no advertir al navegar
    if (kind === "final") {
      window.location.reload();
      return;
    }
    setMsg({ kind: "ok", text: "Borrador guardado. Podés seguir después." });
  }

  if (locked) {
    return (
      <div className="card p-6">
        <div className="mb-3 flex items-center gap-2 text-emerald-500">
          <CheckCircle2 size={22} />
          <h2 className="text-lg font-semibold">Ficha finalizada</h2>
        </div>
        <p className="text-sm text-muted">
          Ya enviaste tu ficha de regularización de datos. Quedó bloqueada para edición.
          Si necesitás corregir algo, pedí a Gerencia o Recursos Humanos que la reabra.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progreso */}
      <div className="flex flex-wrap items-center gap-2">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`badge transition ${
              i === step ? "bg-brandsoft text-brand" : "bg-elevated text-muted hover:text-fg"
            }`}
          >
            {s.id}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted">Sección {section.id} de {SECTIONS.length}</span>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold">{section.title}</h2>
        {section.description && <p className="mt-1 text-sm text-muted">{section.description}</p>}

        <div className="mt-4 flex flex-col gap-4">
          {section.fields.map((f) => {
            if (!isFieldActive(f, allValues)) return null;
            if (f.kind === "children")
              return <ChildrenField key={f.key} field={f} items={kids} onChange={(v) => { setMsg(null); setDirty(true); setKids(v); }} />;
            if (f.kind === "assets")
              return <AssetsField key={f.key} field={f} items={assets} onChange={(v) => { setMsg(null); setDirty(true); setAssets(v); }} />;
            return (
              <FieldInput
                key={f.key}
                field={f}
                value={f.store === "survey" ? survey[f.key] ?? "" : columns[f.key] ?? null}
                onChange={(v) => setValue(f, v)}
              />
            );
          })}
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-500" : "text-red-500"}`}>{msg.text}</p>
      )}

      {/* Navegación */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn-ghost"
        >
          <ChevronLeft size={18} /> Anterior
        </button>
        {step < SECTIONS.length - 1 ? (
          <button onClick={() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1))} className="btn-ghost">
            Siguiente <ChevronRight size={18} />
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <span className="text-xs font-medium text-amber-500" aria-live="polite">
              ● Cambios sin guardar
            </span>
          )}
          <button onClick={() => persist("draft")} disabled={busy !== null} className="btn-ghost">
            {busy === "draft" ? "Guardando…" : "Guardar borrador"}
          </button>
          <button onClick={() => persist("final")} disabled={busy !== null} className="btn-primary">
            <Lock size={16} /> {busy === "final" ? "Finalizando…" : "Finalizar y enviar"}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted">
        Al finalizar, tu ficha queda bloqueada. Guardá como borrador para completarla en varias veces.
      </p>
    </div>
  );
}

// ---------- Campo genérico ----------
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string | boolean | null;
  onChange: (v: string | boolean | null) => void;
}) {
  const label = (
    <span>
      {field.label} {field.required && <span className="text-red-500">*</span>}
    </span>
  );

  if (field.kind === "yesno") {
    // Columna: boolean|null. Encuesta: string "Sí"/"No".
    const isSurvey = field.store === "survey";
    const yes = isSurvey ? value === "Sí" : value === true;
    const no = isSurvey ? value === "No" : value === false;
    return (
      <div className="flex flex-col gap-1 text-sm">
        {label}
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={yes} onChange={() => onChange(true)} /> Sí
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={no} onChange={() => onChange(false)} /> No
          </label>
        </div>
        {field.help && <span className="text-xs text-muted">{field.help}</span>}
      </div>
    );
  }

  const str = typeof value === "string" ? value : "";

  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {field.kind === "textarea" ? (
        <textarea rows={3} value={str} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="input" />
      ) : field.kind === "select" ? (
        <select value={str} onChange={(e) => onChange(e.target.value)} className="input">
          <option value="">Elegí una opción…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.kind === "date" ? "date" : "text"}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="input"
        />
      )}
      {field.help && <span className="text-xs text-muted">{field.help}</span>}
    </label>
  );
}

// ---------- Lista de hijos ----------
function ChildrenField({ field, items, onChange }: { field: Field; items: EmployeeChild[]; onChange: (v: EmployeeChild[]) => void }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span>{field.label}</span>
      {field.help && <span className="text-xs text-muted">{field.help}</span>}
      {items.map((c, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="input" placeholder="Nombre" value={c.name}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
          />
          <input
            className="input max-w-[8rem]" placeholder="Edad" value={c.age}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, age: e.target.value } : x)))}
          />
          <button type="button" className="btn-ghost px-3" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Quitar">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost self-start" onClick={() => onChange([...items, { name: "", age: "" }])}>
        <Plus size={16} /> Agregar hijo/a
      </button>
    </div>
  );
}

// ---------- Lista de equipos/bienes ----------
function AssetsField({ field, items, onChange }: { field: Field; items: EmployeeAsset[]; onChange: (v: EmployeeAsset[]) => void }) {
  function upd(i: number, patch: Partial<EmployeeAsset>) {
    onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span>{field.label}</span>
      {field.help && <span className="text-xs text-muted">{field.help}</span>}
      {items.map((a, i) => (
        <div key={i} className="rounded-xl border border-line p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Tipo (laptop, vehículo…)" value={a.kind} onChange={(e) => upd(i, { kind: e.target.value })} />
            <input className="input" placeholder="Marca" value={a.brand} onChange={(e) => upd(i, { brand: e.target.value })} />
            <input className="input" placeholder="Modelo" value={a.model} onChange={(e) => upd(i, { model: e.target.value })} />
            <input className="input" placeholder="N° serie / código" value={a.serial} onChange={(e) => upd(i, { serial: e.target.value })} />
            <select className="input" value={a.state} onChange={(e) => upd(i, { state: e.target.value })}>
              <option value="">Estado…</option>
              {ASSET_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="button" className="btn-ghost mt-2" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 size={16} /> Quitar
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost self-start" onClick={() => onChange([...items, { kind: "", brand: "", model: "", serial: "", state: "" }])}>
        <Plus size={16} /> Agregar equipo
      </button>
    </div>
  );
}
