// Tipos compartidos del dominio.

export type UserRole = "super_admin" | "admin" | "gerencia" | "apostador";
export type UserStatus = "pendiente" | "aprobado" | "rechazado";
export type MatchPhase = "grupos" | "eliminatoria";
export type MatchStatus = "programado" | "abierto" | "cerrado" | "finalizado";
export type MatchDecision = "regular" | "prorroga" | "penales";
export type BetDecision = "prorroga" | "penales";

// Registro mínimo (fork "trabajadores DMO"): full_name es el nick/apodo visible.
// Los datos personales se recolectan en el relevamiento (EmployeeRecord).
export type Profile = {
  id: string;
  email: string;
  full_name: string; // nick / apodo (display)
  branch: string | null; // sucursal
  emoji: string;
  role: UserRole;
  status: UserStatus;
  must_change_password: boolean;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  code: string;
  group_label: string | null;
  flag_url: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  phase: MatchPhase;
  round_label: string | null;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score_90: number | null;
  away_score_90: number | null;
  winner_team_id: string | null;
  decided_by: MatchDecision | null;
  result_set_by: string | null;
  result_set_at: string | null;
  created_at: string;
};

export type MatchWithTeams = Match & {
  home_team: Team;
  away_team: Team;
  result_setter?: { full_name: string; emoji: string } | null;
};

export type Bet = {
  id: string;
  match_id: string;
  user_id: string;
  predicted_home: number;
  predicted_away: number;
  predicted_winner_team_id: string | null;
  predicted_decision: BetDecision | null;
  points_awarded: number | null;
  created_at: string;
};

export type Standing = {
  user_id: string;
  full_name: string;
  emoji: string;
  total_points: number;
  graded_bets: number;
  hits: number;
};

// Nombre a mostrar de un usuario: el nombre completo.
export function displayName(p: { full_name?: string }): string {
  return p.full_name || "participante";
}

// Nombre corto: solo la primera palabra + "…" si hay más (ej. "Maicol…").
export function shortName(full?: string): string {
  const name = (full || "").trim();
  if (!name) return "—";
  const parts = name.split(/\s+/);
  return parts.length > 1 ? `${parts[0]}…` : parts[0];
}

// ---------- Relevamiento de datos del personal / buzón de reclamos ----------

export type RecordStatus = "borrador" | "finalizado";

export type EmployeeChild = { id?: string; name: string; age: string };
export type EmployeeAsset = {
  id?: string;
  kind: string;
  brand: string;
  model: string;
  serial: string;
  state: string;
};

// Ficha de un trabajador. Las secciones 1 y 2 son columnas; las 3-7 viven en
// `survey_answers` (keyed por id de pregunta, ver src/lib/relevamiento.ts).
export type EmployeeRecord = {
  user_id: string;
  status: RecordStatus;
  // Sección 1
  first_names: string | null;
  last_name_p: string | null;
  last_name_m: string | null;
  birth_date: string | null;
  phone: string | null;
  ci_number: string | null;
  ci_ext: string | null;
  residence_city: string | null;
  home_address: string | null;
  marital_status: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  has_dependents: boolean | null;
  dependents_detail: string | null;
  shirt_size: string | null;
  health_condition: string | null;
  // Sección 2
  hire_date: string | null;
  start_branch: string | null;
  start_position: string | null;
  current_position: string | null;
  department: string | null;
  immediate_boss: string | null;
  prior_roles: string | null;
  has_contract: boolean | null;
  contract_type: string | null;
  no_contract_since: string | null;
  has_memo: boolean | null;
  knows_duties: boolean | null;
  received_manual: boolean | null;
  duties_match: boolean | null;
  staff_in_charge: string | null;
  // Secciones 3-7
  survey_answers: Record<string, string>;
  updated_at: string;
  finalized_at: string | null;
};

export type ComplaintDraft = {
  user_id: string;
  category: string;
  body: string;
  updated_at: string;
};

export type Complaint = {
  id: string;
  category: string;
  body: string;
  submitted_on: string;
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  programado: "Programado",
  abierto: "Abierto",
  cerrado: "Cerrado",
  finalizado: "Finalizado",
};
