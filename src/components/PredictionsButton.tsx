"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Portal from "@/components/Portal";
import TeamFlag from "@/components/TeamFlag";
import { shortName, type BetDecision, type MatchWithTeams } from "@/lib/types";

type Row = {
  user_id: string;
  full_name: string;
  emoji: string;
  predicted_home: number;
  predicted_away: number;
  predicted_winner_team_id: string | null;
  predicted_decision: BetDecision | null;
  points_awarded: number | null;
};

export default function PredictionsButton({ match }: { match: MatchWithTeams }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setOpen(true);
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setMyId(session?.user?.id ?? null);
    const { data, error } = await supabase.rpc("match_predictions", {
      p_match_id: match.id,
    });
    setLoading(false);
    if (error) {
      setError("No se pudieron cargar los pronósticos.");
      return;
    }
    setRows((data as Row[]) ?? []);
  }

  function winnerTeam(id: string | null) {
    if (id === match.home_team_id) return match.home_team;
    if (id === match.away_team_id) return match.away_team;
    return null;
  }

  return (
    <>
      <button
        onClick={load}
        aria-label="Ver pronósticos"
        title="Ver pronósticos"
        className="text-muted transition hover:text-brand"
      >
        <Info size={15} />
      </button>

      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                className="card flex max-h-[82vh] w-full max-w-md flex-col"
                initial={{ scale: 0.95, y: 12, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* header */}
                <div className="flex items-start justify-between gap-3 border-b border-line p-4">
                  <div>
                    <h3 className="font-bold">Pronósticos</h3>
                    <p className="flex flex-wrap items-center gap-1 text-xs text-muted">
                      <TeamFlag url={match.home_team.flag_url} name={match.home_team.name} size={16} />
                      {match.home_team.name} vs {match.away_team.name}
                      <TeamFlag url={match.away_team.flag_url} name={match.away_team.name} size={16} />
                      {match.home_score_90 !== null && (
                        <span className="ml-1 text-brand">
                          · {match.home_score_90}-{match.away_score_90}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar"
                    className="rounded-lg p-1 text-muted transition hover:bg-elevated"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* body */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <motion.p
                      className="py-8 text-center text-sm text-muted"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      Cargando pronósticos…
                    </motion.p>
                  ) : error ? (
                    <p className="py-8 text-center text-sm text-red-500">{error}</p>
                  ) : rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted">
                      Nadie apostó a este partido.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {rows.map((r, i) => {
                        const adv =
                          match.phase === "eliminatoria"
                            ? winnerTeam(r.predicted_winner_team_id)
                            : null;
                        const isMe = r.user_id === myId;
                        return (
                          <div
                            key={r.user_id}
                            className={`rounded-lg px-3 py-2 ${
                              isMe
                                ? "bg-brandsoft ring-1 ring-emerald-500/40"
                                : "bg-elevated/60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="w-5 shrink-0 text-right text-xs font-semibold text-faint">
                                  {i + 1}
                                </span>
                                <span className="text-lg">{r.emoji}</span>
                                <span className="truncate font-medium">
                                  {shortName(r.full_name)}
                                  {isMe && (
                                    <span className="ml-1 text-xs text-brand">(vos)</span>
                                  )}
                                </span>
                                {adv && (
                                  <span
                                    title={`avanza ${adv.name}`}
                                    className="flex shrink-0"
                                  >
                                    <TeamFlag url={adv.flag_url} name={adv.name} size={16} />
                                  </span>
                                )}
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className="font-bold">
                                  {r.predicted_home} - {r.predicted_away}
                                </span>
                                {r.points_awarded !== null && (
                                  <span className="badge bg-brandsoft text-brand">
                                    +{r.points_awarded}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
