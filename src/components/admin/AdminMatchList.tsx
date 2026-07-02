"use client";

import { useState } from "react";
import type { MatchWithTeams } from "@/lib/types";
import { MATCH_STATUS_LABEL } from "@/lib/types";
import { formatKickoff } from "@/lib/format";
import TeamFlag from "@/components/TeamFlag";
import MatchStatusControls from "@/components/admin/MatchStatusControls";
import ResultForm from "@/components/admin/ResultForm";

type Tab = "proximos" | "finalizados";

export default function AdminMatchList({
  matches,
  isSuper,
}: {
  matches: MatchWithTeams[];
  isSuper: boolean;
}) {
  const [tab, setTab] = useState<Tab>("proximos");

  const proximos = matches
    .filter((m) => m.status !== "finalizado")
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );
  const finalizados = matches
    .filter((m) => m.status === "finalizado")
    .sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    );

  const list = tab === "proximos" ? proximos : finalizados;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "proximos", label: "Próximos", count: proximos.length },
    { key: "finalizados", label: "Finalizados", count: finalizados.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex self-start rounded-xl border border-line bg-elevated/50 p-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
              <span
                className={`badge ${
                  active ? "bg-brandsoft text-brand" : "bg-elevated text-muted"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="text-muted">
          {tab === "proximos"
            ? "No hay partidos próximos."
            : "Todavía no hay partidos finalizados."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>
                  {m.phase === "eliminatoria" ? "🏆 Eliminatoria" : "Grupos"}
                  {m.round_label ? ` · ${m.round_label}` : ""} ·{" "}
                  {formatKickoff(m.kickoff_at)}
                </span>
                <span className="badge bg-elevated text-muted">
                  {MATCH_STATUS_LABEL[m.status]}
                </span>
              </div>
              <div className="mb-3 flex items-center justify-center gap-2 text-lg font-bold">
                <span className="flex items-center gap-1.5">
                  {m.home_team.name}
                  <TeamFlag url={m.home_team.flag_url} name={m.home_team.name} />
                </span>
                <span className="text-sm text-muted">vs</span>
                <span className="flex items-center gap-1.5">
                  <TeamFlag url={m.away_team.flag_url} name={m.away_team.name} />
                  {m.away_team.name}
                </span>
              </div>
              <MatchStatusControls matchId={m.id} status={m.status} />
              {m.status !== "programado" &&
                (m.status !== "finalizado" || isSuper) && (
                  <ResultForm match={m} />
                )}
              {m.status === "finalizado" && m.result_setter && (
                <p className="mt-2 border-t border-line pt-2 text-xs text-faint">
                  Resultado cargado por{" "}
                  <span className="text-muted">
                    {m.result_setter.emoji} {m.result_setter.full_name}
                  </span>
                  {m.result_set_at ? ` · ${formatKickoff(m.result_set_at)}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
