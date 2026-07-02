"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { DEFAULT_RESET_PASSWORD } from "@/lib/constants";
import type { MatchDecision, MatchStatus, UserRole, UserStatus } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Bolivia es UTC-4 fijo (sin horario de verano). Un valor de <input
// type="datetime-local"> se interpreta como hora boliviana y se guarda en UTC.
function boliviaLocalToISO(value: string): string | null {
  if (!value) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const d = new Date(`${withSeconds}-04:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ---------- Estado del partido (admin) ----------
export async function setMatchStatus(
  matchId: string,
  status: MatchStatus,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ status })
    .eq("id", matchId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  return { ok: true };
}

// ---------- Cargar resultado y otorgar puntos (admin) ----------
export async function setMatchResult(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const matchId = String(formData.get("match_id") ?? "");
  const home = Number(formData.get("home_score_90"));
  const away = Number(formData.get("away_score_90"));
  const winner = String(formData.get("winner_team_id") ?? "") || null;
  const decidedRaw = String(formData.get("decided_by") ?? "regular");
  const decided: MatchDecision =
    decidedRaw === "prorroga" || decidedRaw === "penales" ? decidedRaw : "regular";

  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return { ok: false, error: "Marcador inválido." };
  }

  const { error } = await supabase.rpc("set_match_result", {
    p_match_id: matchId,
    p_home: home,
    p_away: away,
    p_winner: winner,
    p_decided_by: decided,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath("/mis-pronosticos");
  revalidatePath("/ranking");
  return { ok: true };
}

// ---------- Crear partido (super_admin) ----------
export async function createMatch(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("super_admin");
  const supabase = await createClient();

  const home = String(formData.get("home_team_id") ?? "");
  const away = String(formData.get("away_team_id") ?? "");
  const phase = String(formData.get("phase") ?? "grupos");
  const round = String(formData.get("round_label") ?? "").trim() || null;
  const kickoff = boliviaLocalToISO(String(formData.get("kickoff_at") ?? ""));

  if (!home || !away) return { ok: false, error: "Elegí ambos equipos." };
  if (home === away) return { ok: false, error: "Los equipos deben ser distintos." };
  if (!kickoff) return { ok: false, error: "Fecha/hora inválida." };

  const { error } = await supabase.from("matches").insert({
    home_team_id: home,
    away_team_id: away,
    phase: phase === "eliminatoria" ? "eliminatoria" : "grupos",
    round_label: round,
    kickoff_at: kickoff,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/partidos");
  return { ok: true };
}

// ---------- Equipos (super_admin) ----------
export async function createTeam(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("super_admin");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const group = String(formData.get("group_label") ?? "").trim() || null;
  const flag = String(formData.get("flag_url") ?? "").trim() || null;

  if (!name || !code) return { ok: false, error: "Nombre y código son obligatorios." };

  const { error } = await supabase
    .from("teams")
    .insert({ name, code, group_label: group, flag_url: flag });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/equipos");
  return { ok: true };
}

export async function deleteTeam(teamId: string): Promise<ActionResult> {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/equipos");
  return { ok: true };
}

// ---------- Usuarios (aprobar / rol) ----------
export async function setUserStatus(
  userId: string,
  status: UserStatus,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  // La habilitación de la cuenta es por APROBACIÓN del admin (no por mail). Al
  // aprobar, confirmamos el email en Supabase Auth con la service_role para que
  // el usuario pueda iniciar sesión sin depender de un SMTP / del toggle
  // "Confirm email". Es idempotente, así que reaprobar no causa problema.
  if (status === "aprobado") {
    const admin = createAdminClient();
    const { error: confirmErr } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (confirmErr) return { ok: false, error: confirmErr.message };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult> {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ---------- Restablecer contraseña (super_admin) ----------
// Pone la contraseña temporal y obliga al usuario a cambiarla en el próximo login.
export async function resetUserPassword(
  userId: string,
): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  await requireRole("super_admin");
  const admin = createAdminClient();

  const { error: pwErr } = await admin.auth.admin.updateUserById(userId, {
    password: DEFAULT_RESET_PASSWORD,
  });
  if (pwErr) return { ok: false, error: pwErr.message };

  const { error: flagErr } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", userId);
  if (flagErr) return { ok: false, error: flagErr.message };

  revalidatePath("/admin/usuarios");
  return { ok: true, password: DEFAULT_RESET_PASSWORD };
}

// ---------- Configuración: ventana de apertura de apuestas (super_admin) ----------
export async function setBetOpenHours(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("super_admin");
  const hours = Number(formData.get("hours"));
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
    return { ok: false, error: "Ingresá un número de horas entre 1 y 720." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ bet_open_hours_before: hours })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/partidos");
  return { ok: true };
}

// ---------- Configuración: código de registro (super_admin) ----------
export async function setRegisterCode(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("super_admin");
  const code = String(formData.get("code") ?? "").trim();
  if (code.length > 60) {
    return { ok: false, error: "El código es demasiado largo (máx 60 caracteres)." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ register_code: code })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/configuracion");
  return { ok: true };
}
