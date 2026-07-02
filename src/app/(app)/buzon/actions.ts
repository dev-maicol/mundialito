"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireApproved } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function saveDraft(category: string, body: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { error } = await supabase.from("complaint_drafts").upsert(
    { user_id: user.id, category: category.trim(), body: body.trim(), updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveComplaintDraft(category: string, body: string): Promise<ActionResult> {
  await requireApproved();
  const res = await saveDraft(category, body);
  if (!res.ok) return res;
  revalidatePath("/buzon");
  return { ok: true };
}

// Finaliza el reclamo: el RPC lo anonimiza (copia a complaints SIN user_id,
// marca el envío para el tope de 1 por usuario y borra el borrador).
export async function submitComplaint(category: string, body: string): Promise<ActionResult> {
  await requireApproved();
  if (!body.trim()) return { ok: false, error: "Escribí tu reclamo antes de enviar." };

  const draft = await saveDraft(category, body);
  if (!draft.ok) return draft;

  const supabase = await createClient();
  const { error } = await supabase.rpc("finalizar_reclamo");
  if (error) {
    if (error.message.includes("ya enviaste")) return { ok: false, error: "Ya enviaste un reclamo." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/buzon");
  return { ok: true };
}
