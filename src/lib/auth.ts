import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

// Jerarquía de la QUINIELA. `gerencia` es una capacidad paralela (lee datos de
// RRHH) y para la quiniela se comporta como apostador: no gestiona partidos ni
// aprueba usuarios. Por eso comparte rango con apostador y el acceso a los datos
// del personal se decide con `canReadEmployeeData`, no con `hasRole`.
const ROLE_RANK: Record<UserRole, number> = {
  apostador: 1,
  gerencia: 1,
  admin: 2,
  super_admin: 3,
};

export function hasRole(role: UserRole, required: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

// ¿Puede leer el relevamiento del personal y los reclamos? Solo gerencia y
// super_admin (el admin común, que aprueba usuarios, NO ve datos sensibles).
export function canReadEmployeeData(role: UserRole): boolean {
  return role === "gerencia" || role === "super_admin";
}

// Devuelve el perfil del usuario autenticado (o null si no hay sesión).
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

// Exige sesión + cuenta aprobada. Redirige a /login o /pending según corresponda.
export async function requireApproved(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "aprobado") redirect("/pending");
  return profile;
}

// Exige al menos cierto rol (además de estar aprobado).
export async function requireRole(required: UserRole): Promise<Profile> {
  const profile = await requireApproved();
  if (!hasRole(profile.role, required)) redirect("/partidos");
  return profile;
}

// Exige poder leer datos del personal (gerencia o super_admin).
export async function requireEmployeeReader(): Promise<Profile> {
  const profile = await requireApproved();
  if (!canReadEmployeeData(profile.role)) redirect("/partidos");
  return profile;
}
