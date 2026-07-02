"use client";

import { useActionState } from "react";
import { createMatch, type ActionResult } from "@/app/(app)/admin/actions";
import type { Team } from "@/lib/types";

export default function CreateMatchForm({ teams }: { teams: Team[] }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createMatch,
    null,
  );

  return (
    <form
      action={formAction}
      className="card flex flex-col gap-3 p-4"
    >
      <h2 className="font-bold">Nuevo partido</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Local
          <select name="home_team_id" required defaultValue="" className="input">
            <option value="" disabled>Elegí…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Visitante
          <select name="away_team_id" required defaultValue="" className="input">
            <option value="" disabled>Elegí…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fase
          <select name="phase" defaultValue="grupos" className="input">
            <option value="grupos">Fase de grupos</option>
            <option value="eliminatoria">Eliminatoria</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ronda (opcional)
          <input name="round_label" placeholder="Octavos, Cuartos…" className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Fecha y hora (Bolivia)
          <input type="datetime-local" name="kickoff_at" required className="input" />
        </label>
      </div>

      {state && !state.ok && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand">Partido creado.</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Creando…" : "Crear partido"}
      </button>
    </form>
  );
}
