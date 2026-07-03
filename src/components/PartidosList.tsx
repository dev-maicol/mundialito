"use client";

import { useState } from "react";
import type { Bet, MatchWithTeams } from "@/lib/types";
import MatchCard from "@/components/MatchCard";

type Tab = "proximos" | "finalizados";

export default function PartidosList({
  matches,
  bets,
  betCounts,
  isSuperAdmin = false,
}: {
  matches: MatchWithTeams[];
  bets: Record<string, Bet>;
  betCounts: Record<string, number>;
  isSuperAdmin?: boolean;
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
                active
                  ? "bg-surface text-fg shadow-sm"
                  : "text-muted hover:text-fg"
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
            <MatchCard
              key={m.id}
              match={m}
              bet={bets[m.id]}
              betCount={betCounts[m.id] ?? 0}
              isSuperAdmin={isSuperAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
