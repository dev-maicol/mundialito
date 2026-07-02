"use client";

import { useState } from "react";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { saveComplaintDraft, submitComplaint } from "@/app/(app)/buzon/actions";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import type { ComplaintDraft } from "@/lib/types";

export const COMPLAINT_CATEGORIES = [
  "Trato / relaciones laborales",
  "Acoso o maltrato",
  "Seguridad e higiene",
  "Equipos y recursos",
  "Organización del trabajo",
  "Comunicación con jefaturas",
  "Sugerencia de mejora",
  "Otro",
];

export default function BuzonForm({
  draft,
  alreadySent,
}: {
  draft: ComplaintDraft | null;
  alreadySent: boolean;
}) {
  const [category, setCategory] = useState(draft?.category ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [busy, setBusy] = useState<null | "draft" | "send">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  useUnsavedChangesWarning(
    dirty,
    "Tenés un reclamo sin guardar. Si salís ahora se perderá.\n\n¿Salir de todos modos?",
  );

  if (alreadySent) {
    return (
      <div className="card p-6">
        <div className="mb-3 flex items-center gap-2 text-blue-500">
          <CheckCircle2 size={22} />
          <h2 className="text-lg font-semibold">Reclamo enviado</h2>
        </div>
        <p className="text-sm text-muted">
          Gracias. Tu reclamo fue enviado de forma anónima y ya no está vinculado a tu cuenta.
          Solo se permite un envío por persona. Si necesitás enviar otro, pedí a Gerencia o
          Recursos Humanos que habilite el buzón nuevamente.
        </p>
      </div>
    );
  }

  async function run(kind: "draft" | "send") {
    setBusy(kind);
    setMsg(null);
    const res = kind === "draft" ? await saveComplaintDraft(category, body) : await submitComplaint(category, body);
    setBusy(null);
    if (!res.ok) return setMsg({ kind: "err", text: res.error });
    setDirty(false); // ya está persistido
    if (kind === "send") return window.location.reload();
    setMsg({ kind: "ok", text: "Borrador guardado. Solo vos podés verlo hasta que lo envíes." });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-xl border border-line bg-elevated p-3 text-xs text-muted">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-500" />
        <span>
          Este buzón es <strong>anónimo</strong>. Mientras sea borrador, solo vos lo ves. Al
          enviarlo, el contenido llega a Gerencia <strong>sin quedar vinculado a tu identidad</strong>.
          Usalo con responsabilidad y respeto.
        </span>
      </div>

      <div className="card flex flex-col gap-4 p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span>Categoría</span>
          <select value={category} onChange={(e) => { setDirty(true); setCategory(e.target.value); }} className="input">
            <option value="">Elegí una categoría…</option>
            {COMPLAINT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>Tu reclamo, queja o sugerencia</span>
          <textarea
            rows={7}
            value={body}
            onChange={(e) => { setDirty(true); setBody(e.target.value); }}
            placeholder="Contanos qué pasó o qué proponés…"
            className="input"
          />
        </label>
      </div>

      {msg && <p className={`text-sm ${msg.kind === "ok" ? "text-blue-500" : "text-red-500"}`}>{msg.text}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {dirty && (
          <span className="text-xs font-medium text-amber-500" aria-live="polite">
            ● Cambios sin guardar
          </span>
        )}
        <button onClick={() => run("draft")} disabled={busy !== null} className="btn-ghost">
          {busy === "draft" ? "Guardando…" : "Guardar borrador"}
        </button>
        <button onClick={() => run("send")} disabled={busy !== null} className="btn-primary">
          <Send size={16} /> {busy === "send" ? "Enviando…" : "Enviar (anónimo)"}
        </button>
      </div>
    </div>
  );
}
