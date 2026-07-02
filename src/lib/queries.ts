import { createClient } from "@/lib/supabase/server";
import type { MatchWithTeams } from "@/lib/types";

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  result_setter:profiles!matches_result_set_by_fkey(full_name, emoji)
`;

export async function getMatchesWithTeams(): Promise<MatchWithTeams[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .order("kickoff_at", { ascending: true });
  return (data as MatchWithTeams[] | null) ?? [];
}

// Ordena partidos: primero los no finalizados por kickoff ascendente,
// luego los finalizados por kickoff descendente.
export function sortForDisplay(matches: MatchWithTeams[]): MatchWithTeams[] {
  const pending = matches.filter((m) => m.status !== "finalizado");
  const done = matches
    .filter((m) => m.status === "finalizado")
    .reverse();
  return [...pending, ...done];
}
