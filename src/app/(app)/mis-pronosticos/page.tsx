import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Bet, MatchWithTeams } from "@/lib/types";
import { formatKickoff } from "@/lib/format";
import TeamFlag from "@/components/TeamFlag";

export const dynamic = "force-dynamic";

type BetWithMatch = Bet & { match: MatchWithTeams };

function pickedWinner(b: BetWithMatch): string | null {
  if (b.match.phase !== "eliminatoria") return null;
  if (b.predicted_winner_team_id === b.match.home_team_id)
    return b.match.home_team.name;
  if (b.predicted_winner_team_id === b.match.away_team_id)
    return b.match.away_team.name;
  return null;
}

export default async function MisApuestasPage() {
  const profile = await requireApproved();
  const supabase = await createClient();

  const { data } = await supabase
    .from("bets")
    .select(
      `*, match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*))`,
    )
    .eq("user_id", profile.id);

  const bets = ((data as BetWithMatch[] | null) ?? []).sort(
    (a, b) =>
      new Date(b.match.kickoff_at).getTime() -
      new Date(a.match.kickoff_at).getTime(),
  );

  const total = bets.reduce((sum, b) => sum + (b.points_awarded ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Mis pronósticos</h1>
        <span className="rounded-lg bg-emerald-500 px-3 py-1 font-bold text-slate-950">
          {total} pts
        </span>
      </div>

      {bets.length === 0 ? (
        <p className="text-muted">Todavía no hiciste ningún pronóstico.</p>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <div className="flex flex-col gap-3 sm:hidden">
            {bets.map((b) => (
              <div key={b.id} className="card p-3">
                <div className="flex flex-wrap items-center gap-1.5 font-medium">
                  <TeamFlag url={b.match.home_team.flag_url} name={b.match.home_team.name} size={18} />
                  {b.match.home_team.name}
                  <span className="text-faint">vs</span>
                  {b.match.away_team.name}
                  <TeamFlag url={b.match.away_team.flag_url} name={b.match.away_team.name} size={18} />
                </div>
                <div className="mt-1 text-xs text-faint">
                  {formatKickoff(b.match.kickoff_at)}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted">Tu pronóstico</div>
                    <div className="font-semibold">
                      {b.predicted_home} - {b.predicted_away}
                    </div>
                    {pickedWinner(b) && (
                      <div className="text-[10px] text-muted">
                        avanza {pickedWinner(b)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted">Resultado</div>
                    <div className="text-muted">
                      {b.match.home_score_90 !== null
                        ? `${b.match.home_score_90} - ${b.match.away_score_90}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Puntos</div>
                    <div>
                      {b.points_awarded === null ? (
                        <span className="text-faint">—</span>
                      ) : (
                        <span className="font-bold text-brand">
                          +{b.points_awarded}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden overflow-x-auto sm:block">
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-elevated/60 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Partido</th>
                    <th className="px-3 py-2 text-center">Tu pronóstico</th>
                    <th className="px-3 py-2 text-center">Resultado</th>
                    <th className="px-3 py-2 text-center">Puntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bets.map((b) => (
                    <tr key={b.id} className="hover:bg-hover">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 font-medium">
                          <TeamFlag url={b.match.home_team.flag_url} name={b.match.home_team.name} size={18} />
                          {b.match.home_team.name}
                          <span className="text-faint">vs</span>
                          {b.match.away_team.name}
                          <TeamFlag url={b.match.away_team.flag_url} name={b.match.away_team.name} size={18} />
                        </div>
                        <div className="text-xs text-faint">
                          {formatKickoff(b.match.kickoff_at)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">
                        {b.predicted_home} - {b.predicted_away}
                        {pickedWinner(b) && (
                          <div className="text-[10px] font-normal text-muted">
                            avanza {pickedWinner(b)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-muted">
                        {b.match.home_score_90 !== null
                          ? `${b.match.home_score_90} - ${b.match.away_score_90}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {b.points_awarded === null ? (
                          <span className="text-faint">—</span>
                        ) : (
                          <span className="font-bold text-brand">
                            +{b.points_awarded}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
