"use client";

import { useActionState } from "react";
import { createTeam, type ActionResult } from "@/app/(app)/admin/actions";

export default function CreateTeamForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createTeam,
    null,
  );

  return (
    <form
      action={formAction}
      className="card flex flex-col gap-3 p-4"
    >
      <h2 className="font-bold">Nuevo equipo</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2 flex flex-col gap-1 text-sm">
          Nombre
          <input name="name" required className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Código
          <input name="code" required maxLength={3} placeholder="ARG" className="input uppercase" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Grupo
          <input name="group_label" maxLength={2} placeholder="A" className="input" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-4">
          URL de bandera (opcional)
          <input name="flag_url" className="input" />
        </label>
      </div>
      {state && !state.ok && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand">Equipo creado.</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Guardando…" : "Agregar equipo"}
      </button>
    </form>
  );
}
