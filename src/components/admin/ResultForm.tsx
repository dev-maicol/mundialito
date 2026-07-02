"use client";

import { useActionState, useState } from "react";
import { setMatchResult, type ActionResult } from "@/app/(app)/admin/actions";
import type { MatchWithTeams } from "@/lib/types";
import Portal from "@/components/Portal";
import TeamFlag from "@/components/TeamFlag";

export default function ResultForm({ match }: { match: MatchWithTeams }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    setMatchResult,
    null,
  );
  const [home, setHome] = useState(String(match.home_score_90 ?? ""));
  const [away, setAway] = useState(String(match.away_score_90 ?? ""));
  const [winner, setWinner] = useState(match.winner_team_id ?? "");
  const [decision, setDecision] = useState(
    match.decided_by && match.decided_by !== "regular" ? match.decided_by : "",
  );
  const [confirming, setConfirming] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isKnockout = match.phase === "eliminatoria";
  const isDraw = home !== "" && away !== "" && Number(home) === Number(away);
  const formId = `result-${match.id}`;
  const isCorrection = match.status === "finalizado";

  function openConfirm() {
    setLocalError(null);
    if (home === "" || away === "" || Number(home) < 0 || Number(away) < 0) {
      setLocalError("Ingresá un marcador válido.");
      return;
    }
    if (isKnockout) {
      if (!winner) {
        setLocalError("Indicá qué equipo avanza.");
        return;
      }
      if (isDraw && !decision) {
        setLocalError("Indicá si se define por prórroga o penales.");
        return;
      }
    }
    setConfirming(true);
  }

  const winnerName =
    winner === match.home_team_id
      ? match.home_team.name
      : winner === match.away_team_id
        ? match.away_team.name
        : "";

  return (
    <form
      id={formId}
      action={formAction}
      className="mt-2 flex flex-col gap-2 border-t border-line pt-2"
    >
      <input type="hidden" name="match_id" value={match.id} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} size={18} />
          {match.home_team.name}
        </span>
        <input
          type="number"
          name="home_score_90"
          min={0}
          required
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-14 rounded-lg border border-linestrong bg-elevated px-2 py-1 text-center text-fg"
        />
        <span>-</span>
        <input
          type="number"
          name="away_score_90"
          min={0}
          required
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-14 rounded-lg border border-linestrong bg-elevated px-2 py-1 text-center text-fg"
        />
        <span className="flex items-center gap-1.5 font-medium">
          {match.away_team.name}
          <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} size={18} />
        </span>
        <span className="text-xs text-faint">(a los 90&apos;)</span>
      </div>

      {isKnockout && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-sm">
          <label className="flex items-center gap-2">
            Avanza:
            <select
              name="winner_team_id"
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
              required
              className="input"
            >
              <option value="" disabled>
                Elegí…
              </option>
              <option value={match.home_team_id}>{match.home_team.name}</option>
              <option value={match.away_team_id}>{match.away_team.name}</option>
            </select>
          </label>
          {isDraw && (
            <div className="flex items-center gap-4">
              <span className="text-muted">Definido por:</span>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="decided_by"
                  value="prorroga"
                  checked={decision === "prorroga"}
                  onChange={(e) => setDecision(e.target.value as "prorroga")}
                  required
                />
                Prórroga
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="decided_by"
                  value="penales"
                  checked={decision === "penales"}
                  onChange={(e) => setDecision(e.target.value as "penales")}
                />
                Penales
              </label>
            </div>
          )}
        </div>
      )}

      {localError && <p className="text-xs text-red-500">{localError}</p>}
      {state && !state.ok && <p className="text-xs text-red-500">{state.error}</p>}
      {state?.ok && (
        <p className="text-xs text-brand">Resultado guardado y puntos otorgados.</p>
      )}

      <button
        type="button"
        onClick={openConfirm}
        className="self-start rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {isCorrection ? "Corregir resultado" : "Cargar resultado y dar puntos"}
      </button>

      {confirming && (
        <Portal>
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-5">
              <h3 className="text-lg font-bold">
                {isCorrection ? "Corregir resultado" : "Confirmar resultado"}
              </h3>
              <div className="my-4 rounded-xl border border-line bg-elevated/60 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <span className="flex items-center gap-1">
                    <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} size={18} />
                    {match.home_team.name}
                  </span>
                  vs
                  <span className="flex items-center gap-1">
                    <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} size={18} />
                    {match.away_team.name}
                  </span>
                </div>
                <div className="mt-1 text-3xl font-extrabold text-brand">
                  {home} - {away}
                </div>
                {isKnockout && winnerName && (
                  <div className="mt-1 text-sm text-muted">
                    Avanza <span className="font-medium text-fg">{winnerName}</span>
                    {isDraw && decision
                      ? ` por ${decision === "prorroga" ? "prórroga" : "penales"}`
                      : ""}
                  </div>
                )}
              </div>
              <p className="text-sm text-amber-600">
                ⚠️ Se finalizará el partido y se otorgarán los puntos a todos los
                participantes
                {isCorrection ? " (recalculando los anteriores)" : ""}.
              </p>
              {state && !state.ok && (
                <p className="mt-3 text-sm text-red-500">{state.error}</p>
              )}

              {state?.ok ? (
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="btn-primary mt-5 w-full"
                >
                  Listo
                </button>
              ) : (
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={pending}
                    className="btn-ghost flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form={formId}
                    disabled={pending}
                    className="btn-primary flex-1"
                  >
                    {pending ? "Guardando…" : "Confirmar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </form>
  );
}
