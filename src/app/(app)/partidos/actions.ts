"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireApproved } from "@/lib/auth";
import type { Match } from "@/lib/types";

export type PlaceBetResult = { ok: true } | { ok: false; error: string };

export async function placeBet(
  _prev: PlaceBetResult | null,
  formData: FormData,
): Promise<PlaceBetResult> {
  const profile = await requireApproved();
  const supabase = await createClient();

  const matchId = String(formData.get("match_id") ?? "");
  const home = Number(formData.get("predicted_home"));
  const away = Number(formData.get("predicted_away"));

  if (!matchId) return { ok: false, error: "Partido inválido." };
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return { ok: false, error: "Ingresá un marcador válido." };
  }

  // Traemos el partido para conocer su fase y equipos.
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single<Match>();

  if (!match) return { ok: false, error: "El partido no existe." };

  let winner: string | null = null;

  if (match.phase === "eliminatoria") {
    if (home === away) {
      // Empate a 90' → el apostador elige quién avanza (alargue/penales).
      winner = String(formData.get("predicted_winner_team_id") ?? "") || null;
      if (!winner) {
        return { ok: false, error: "Empate a los 90': elegí qué equipo avanza." };
      }
      if (winner !== match.home_team_id && winner !== match.away_team_id) {
        return { ok: false, error: "El equipo que avanza no corresponde a este partido." };
      }
    } else {
      // Marcador definido → avanza el de mayor marcador a los 90'.
      winner = home > away ? match.home_team_id : match.away_team_id;
    }
  }

  const { error } = await supabase.from("bets").insert({
    match_id: matchId,
    user_id: profile.id,
    predicted_home: home,
    predicted_away: away,
    predicted_winner_team_id: winner,
    predicted_decision: null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya hiciste tu pronóstico para este partido." };
    }
    // Violación de RLS (partido cerrado / fuera de hora / no aprobado).
    return {
      ok: false,
      error: "No se pudo registrar el pronóstico. El partido podría estar cerrado.",
    };
  }

  revalidatePath("/partidos");
  revalidatePath("/mis-pronosticos");
  return { ok: true };
}
