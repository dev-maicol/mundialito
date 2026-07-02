import { User } from "lucide-react";
import type { Bet, MatchWithTeams } from "@/lib/types";
import { formatKickoff, isPastKickoff } from "@/lib/format";
import { MATCH_STATUS_LABEL } from "@/lib/types";
import Countdown from "@/components/Countdown";
import BetForm from "@/components/BetForm";
import PredictionsButton from "@/components/PredictionsButton";
import TeamFlag from "@/components/TeamFlag";
import Tooltip from "@/components/Tooltip";

function StatusBadge({ match }: { match: MatchWithTeams }) {
  const open = match.status === "abierto" && !isPastKickoff(match.kickoff_at);
  const styles: Record<string, string> = {
    abierto: "bg-brandsoft text-brand",
    cerrado: "bg-amber-500/15 text-amber-600",
    finalizado: "bg-elevated text-muted",
    programado: "bg-elevated text-muted",
  };
  const key = open ? "abierto" : match.status;
  return <span className={`badge ${styles[key]}`}>{MATCH_STATUS_LABEL[match.status]}</span>;
}

function ResultLine({ match }: { match: MatchWithTeams }) {
  if (match.home_score_90 === null || match.away_score_90 === null) return null;
  const extra =
    match.phase === "eliminatoria" && match.decided_by && match.decided_by !== "regular"
      ? ` (def. por ${match.decided_by === "prorroga" ? "prórroga" : "penales"})`
      : "";
  const winnerName =
    match.winner_team_id === match.home_team_id
      ? match.home_team.name
      : match.winner_team_id === match.away_team_id
        ? match.away_team.name
        : null;
  return (
    <p className="text-center text-sm text-muted">
      Resultado:{" "}
      <span className="font-semibold text-fg">
        {match.home_score_90} - {match.away_score_90}
      </span>
      {extra}
      {match.phase === "eliminatoria" && winnerName && (
        <span className="block text-xs">Avanzó {winnerName}</span>
      )}
    </p>
  );
}

function BetLine({ bet, match }: { bet: Bet; match: MatchWithTeams }) {
  const winnerName =
    bet.predicted_winner_team_id === match.home_team_id
      ? match.home_team.name
      : bet.predicted_winner_team_id === match.away_team_id
        ? match.away_team.name
        : null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 rounded-lg bg-elevated/60 px-3 py-2 text-sm">
      <span className="text-muted">Tu pronóstico:</span>
      <span className="font-semibold text-fg">
        {bet.predicted_home} - {bet.predicted_away}
      </span>
      {match.phase === "eliminatoria" && winnerName && (
        <span className="text-muted">· avanza {winnerName}</span>
      )}
      {bet.points_awarded !== null && (
        <span className="badge bg-brandsoft font-semibold text-brand">
          +{bet.points_awarded} pts
        </span>
      )}
    </div>
  );
}

export default function MatchCard({
  match,
  bet,
  betCount = 0,
}: {
  match: MatchWithTeams;
  bet: Bet | undefined;
  betCount?: number;
}) {
  const bettingOpen = match.status === "abierto" && !isPastKickoff(match.kickoff_at);
  const closed =
    match.status === "cerrado" ||
    match.status === "finalizado" ||
    isPastKickoff(match.kickoff_at);

  return (
    <div className="card p-4 transition-colors hover:border-emerald-500/30">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="font-medium uppercase tracking-wide">
          {match.phase === "eliminatoria" ? "🏆 Eliminatoria" : "Fase de grupos"}
          {match.round_label ? ` · ${match.round_label}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          {bet && !closed && (
            <Tooltip label="Pronósticos hasta el momento">
              <span className="badge bg-emerald-500/20 font-bold text-emerald-400 ring-1 ring-emerald-500/40">
                <User size={11} className="mr-0.5" />
                {betCount}
              </span>
            </Tooltip>
          )}
          {formatKickoff(match.kickoff_at)}
          {closed && <PredictionsButton match={match} />}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-center gap-3 text-lg font-bold">
        <span className="flex w-32 items-center justify-end gap-2 text-right">
          {match.home_team.name}
          <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} />
        </span>
        <span className="rounded-md bg-elevated px-2 py-0.5 text-xs font-medium text-muted">
          VS
        </span>
        <span className="flex w-32 items-center gap-2 text-left">
          <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} />
          {match.away_team.name}
        </span>
      </div>

      <ResultLine match={match} />

      {bet ? (
        <div className="mt-2">
          <BetLine bet={bet} match={match} />
        </div>
      ) : bettingOpen ? (
        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-3 text-center text-xs font-semibold text-brand">
            <Countdown kickoffIso={match.kickoff_at} />
          </div>
          <BetForm match={match} />
        </div>
      ) : (
        <div className="mt-3 flex justify-center border-t border-line pt-3">
          <StatusBadge match={match} />
        </div>
      )}
    </div>
  );
}
