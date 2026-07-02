"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClearResult = { ok: true } | { ok: false; error: string };

// Limpia la marca must_change_password del usuario actual.
// (La contraseña ya la cambió el propio usuario desde su sesión, para no perderla.)
export async function clearMustChangePassword(): Promise<ClearResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
