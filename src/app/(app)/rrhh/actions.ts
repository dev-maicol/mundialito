"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEmployeeReader } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Reabre una ficha finalizada para que el trabajador pueda corregirla.
export async function reabrirFicha(userId: string): Promise<ActionResult> {
  await requireEmployeeReader();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reabrir_relevamiento", { p_user: userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/rrhh");
  return { ok: true };
}

// Libera el candado del buzón para que ese usuario pueda enviar otro reclamo.
// (No reasocia el reclamo anónimo anterior; solo permite uno nuevo.)
export async function liberarReclamo(userId: string): Promise<ActionResult> {
  await requireEmployeeReader();
  const supabase = await createClient();
  const { error } = await supabase.rpc("liberar_reclamo", { p_user: userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/rrhh");
  return { ok: true };
}
