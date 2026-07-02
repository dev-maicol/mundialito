"use client";

import { useActionState, useState } from "react";
import { placeBet, type PlaceBetResult } from "@/app/(app)/partidos/actions";
import type { MatchWithTeams } from "@/lib/types";
import Portal from "@/components/Portal";
import TeamFlag from "@/components/TeamFlag";
import VersusBanner from "@/components/VersusBanner";

export default function BetForm({ match }: { match: MatchWithTeams }) {
  const [state, formAction, pending] = useActionState<
    PlaceBetResult | null,
    FormData
  >(placeBet, null);

  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [winner, setWinner] = useState(""); // solo se usa cuando hay empate
  const [confirming, setConfirming] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isKnockout = match.phase === "eliminatoria";

  // Estado del marcador
  const bothFilled = home !== "" && away !== "";
  const homeN = Number(home);
  const awayN = Number(away);
  const isTie = bothFilled && homeN === awayN;
  const decided = bothFilled && homeN !== awayN; // hay un ganador a los 90'
  // Si el marcador NO es empate, el que avanza queda determinado por el marcador.
  const autoWinner = decided
    ? homeN > awayN
      ? match.home_team_id
      : match.away_team_id
    : "";
  // Ganador efectivo: automático si el marcador define; si hay empate, el elegido.
  const effectiveWinner = decided ? autoWinner : winner;

  if (state?.ok) {
    return (
      <p className="rounded-lg border border-blue-500/20 bg-brandsoft px-3 py-2 text-center text-sm font-medium text-brand">
        ¡Pronóstico registrado! ⚽
      </p>
    );
  }

  function openConfirm() {
    setLocalError(null);
    if (home === "" || away === "" || Number(home) < 0 || Number(away) < 0) {
      setLocalError("Ingresá un marcador válido.");
      return;
    }
    // Solo se exige elegir quién avanza cuando el marcador es empate.
    if (isKnockout && isTie && !winner) {
      setLocalError("Empate a los 90': elegí qué equipo avanza.");
      return;
    }
    setConfirming(true);
  }

  const winnerName =
    effectiveWinner === match.home_team_id
      ? match.home_team.name
      : effectiveWinner === match.away_team_id
        ? match.away_team.name
        : "";
  const formId = `bet-${match.id}`;

  const scoreInput =
    "w-14 rounded-lg border border-linestrong bg-elevated px-2 py-1 text-center text-lg font-bold text-fg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

  function teamBtn(teamId: string) {
    const base =
      "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition ";
    if (effectiveWinner === teamId) {
      return (
        base +
        "border-blue-500 bg-brandsoft text-brand ring-1 ring-blue-500/40"
      );
    }
    // No seleccionado:
    if (decided) {
      // El marcador ya define al ganador → el otro queda bloqueado.
      return base + "border-line bg-elevated text-faint opacity-40 cursor-not-allowed";
    }
    if (winner !== "") {
      // Empate con el otro equipo elegido → este queda atenuado pero clickeable.
      return (
        base +
        "border-line bg-elevated text-faint opacity-50 hover:bg-hover hover:opacity-100"
      );
    }
    return base + "border-line bg-elevated text-muted hover:bg-hover";
  }

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="match_id" value={match.id} />

      {isKnockout && (
        <p className="text-center text-xs font-medium text-muted">
          Marcador a los 90&apos;
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
        <span className="flex w-28 items-center justify-end gap-1.5 text-right text-sm font-medium text-muted">
          {match.home_team.name}
          <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} size={18} />
        </span>
        <input
          type="number"
          name="predicted_home"
          min={0}
          required
          value={home}
          onChange={(e) => {
            setHome(e.target.value);
            setWinner(""); // al cambiar el marcador, se resetea la elección
          }}
          className={scoreInput}
        />
        <span className="text-faint">-</span>
        <input
          type="number"
          name="predicted_away"
          min={0}
          required
          value={away}
          onChange={(e) => {
            setAway(e.target.value);
            setWinner(""); // al cambiar el marcador, se resetea la elección
          }}
          className={scoreInput}
        />
        <span className="flex w-28 items-center gap-1.5 text-left text-sm font-medium text-muted">
          <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} size={18} />
          {match.away_team.name}
        </span>
      </div>

      {isKnockout && (
        <div className="flex flex-col gap-1.5">
          <input
            type="hidden"
            name="predicted_winner_team_id"
            value={effectiveWinner}
          />
          <span className="text-center text-xs font-medium text-muted">
            ¿Quién avanza?
            {isTie && (
              <span className="text-faint"> (empate a 90&apos; → vos elegís)</span>
            )}
            {decided && (
              <span className="text-faint"> (lo define el marcador)</span>
            )}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={decided}
              onClick={() => !decided && setWinner(match.home_team_id)}
              className={teamBtn(match.home_team_id)}
            >
              <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} size={16} />
              {match.home_team.name}
            </button>
            <button
              type="button"
              disabled={decided}
              onClick={() => !decided && setWinner(match.away_team_id)}
              className={teamBtn(match.away_team_id)}
            >
              <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} size={16} />
              {match.away_team.name}
            </button>
          </div>
        </div>
      )}

      {localError && <p className="text-sm text-red-500">{localError}</p>}
      {state && !state.ok && <p className="text-sm text-red-500">{state.error}</p>}

      <button type="button" onClick={openConfirm} className="btn-primary w-full">
        Pronosticar
      </button>
      <p className="text-center text-xs text-faint">
        Un solo pronóstico por partido. No se puede modificar.
      </p>

      <Portal>
        {confirming && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-5">
              <h3 className="text-lg font-bold">Confirmá tu pronóstico</h3>
              <div className="my-4">
                <VersusBanner home={match.home_team} away={match.away_team} />
                <div className="mt-3 text-center text-4xl font-extrabold text-brand">
                  {home} - {away}
                </div>
                {isKnockout && (
                  <div className="mt-1 text-center text-xs text-faint">
                    (a los 90&apos;)
                  </div>
                )}
                {isKnockout && winnerName && (
                  <div className="mt-1 text-center text-sm text-muted">
                    Avanza{" "}
                    <span className="font-medium text-fg">{winnerName}</span>
                  </div>
                )}
              </div>
              <p className="whitespace-nowrap rounded-lg bg-amber-500/10 py-2 text-center font-medium text-amber-600 text-[clamp(0.56rem,2.9vw,0.8rem)]">
                ⚠️ Pronóstico <strong>definitivo</strong> y no se podrá modificar.
              </p>
              {state && !state.ok && (
                <p className="mt-3 text-sm text-red-500">{state.error}</p>
              )}
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
            </div>
          </div>
        )}
      </Portal>
    </form>
  );
}
