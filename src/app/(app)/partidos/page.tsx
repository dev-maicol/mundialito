import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatchesWithTeams } from "@/lib/queries";
import type { Bet } from "@/lib/types";
import PartidosList from "@/components/PartidosList";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const profile = await requireApproved();
  const supabase = await createClient();

  const matches = await getMatchesWithTeams();

  const { data: betsData } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", profile.id);

  const betsByMatch: Record<string, Bet> = {};
  (betsData as Bet[] | null)?.forEach((b) => {
    betsByMatch[b.match_id] = b;
  });

  const { data: countsData } = await supabase
    .from("match_bet_counts")
    .select("match_id, bet_count");

  const betCounts: Record<string, number> = {};
  (countsData as { match_id: string; bet_count: number }[] | null)?.forEach(
    (c) => {
      betCounts[c.match_id] = c.bet_count;
    },
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Partidos</h1>
        <p className="text-sm text-muted">
          Acertar el equipo ganador suma 3 pts; el marcador exacto, 2 pts más.
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="text-muted">Todavía no hay partidos cargados.</p>
      ) : (
        <PartidosList
          matches={matches}
          bets={betsByMatch}
          betCounts={betCounts}
          isSuperAdmin={profile.role === "super_admin"}
        />
      )}
    </div>
  );
}
