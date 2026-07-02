"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireApproved } from "@/lib/auth";
import {
  COLUMN_FIELDS,
  SURVEY_FIELDS,
  BOOLEAN_COLUMNS,
  DATE_COLUMNS,
  missingRequired,
} from "@/lib/relevamiento";
import type { EmployeeChild, EmployeeAsset } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type RelevamientoPayload = {
  columns: Record<string, string | boolean | null>;
  survey: Record<string, string>;
  children: EmployeeChild[];
  assets: EmployeeAsset[];
};

const COLUMN_KEYS = new Set(COLUMN_FIELDS.map((f) => f.key));
const SURVEY_KEYS = new Set(SURVEY_FIELDS.map((f) => f.key));
const BOOL = new Set(BOOLEAN_COLUMNS);
const DATE = new Set(DATE_COLUMNS);

// Normaliza el payload del cliente a lo que espera la base (whitelist + casteo).
function normalize(payload: RelevamientoPayload) {
  const columns: Record<string, string | boolean | null> = {};
  for (const key of COLUMN_KEYS) {
    const raw = payload.columns?.[key];
    if (BOOL.has(key)) {
      columns[key] = typeof raw === "boolean" ? raw : null;
    } else if (DATE.has(key)) {
      const s = typeof raw === "string" ? raw.trim() : "";
      columns[key] = s === "" ? null : s;
    } else {
      const s = typeof raw === "string" ? raw.trim() : "";
      columns[key] = s === "" ? null : s;
    }
  }

  const survey: Record<string, string> = {};
  for (const key of SURVEY_KEYS) {
    const raw = payload.survey?.[key];
    if (typeof raw === "boolean") survey[key] = raw ? "Sí" : "No";
    else if (typeof raw === "string" && raw.trim() !== "") survey[key] = raw.trim();
  }

  const children = (payload.children ?? [])
    .map((c) => ({ name: (c.name ?? "").trim(), age: (c.age ?? "").trim() }))
    .filter((c) => c.name !== "" || c.age !== "");

  const assets = (payload.assets ?? [])
    .map((a) => ({
      kind: (a.kind ?? "").trim(),
      brand: (a.brand ?? "").trim(),
      model: (a.model ?? "").trim(),
      serial: (a.serial ?? "").trim(),
      state: (a.state ?? "").trim(),
    }))
    .filter((a) => a.kind || a.brand || a.model || a.serial || a.state);

  return { columns, survey, children, assets };
}

// Guarda (o crea) el borrador con los datos actuales. RLS bloquea si ya está
// finalizado (solo Gerencia puede reabrirlo).
async function persist(payload: RelevamientoPayload) {
  const { columns, survey, children, assets } = normalize(payload);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sesión no válida." };

  const { error: recErr } = await supabase.from("employee_records").upsert(
    { user_id: user.id, status: "borrador", survey_answers: survey, updated_at: new Date().toISOString(), ...columns },
    { onConflict: "user_id" },
  );
  if (recErr) return { ok: false as const, error: recErr.message };

  // Reemplaza listas (borrar + insertar). RLS permite solo mientras es borrador.
  await supabase.from("employee_children").delete().eq("user_id", user.id);
  if (children.length) {
    const { error } = await supabase
      .from("employee_children")
      .insert(children.map((c) => ({ ...c, user_id: user.id })));
    if (error) return { ok: false as const, error: error.message };
  }

  await supabase.from("employee_assets").delete().eq("user_id", user.id);
  if (assets.length) {
    const { error } = await supabase
      .from("employee_assets")
      .insert(assets.map((a) => ({ ...a, user_id: user.id })));
    if (error) return { ok: false as const, error: error.message };
  }

  return { ok: true as const, columns, survey };
}

export async function saveDraft(payload: RelevamientoPayload): Promise<ActionResult> {
  await requireApproved();
  const res = await persist(payload);
  if (!res.ok) return res;
  revalidatePath("/relevamiento");
  return { ok: true };
}

export async function finalizeRecord(payload: RelevamientoPayload): Promise<ActionResult> {
  await requireApproved();
  const res = await persist(payload);
  if (!res.ok) return res;

  const missing = missingRequired(res.columns, res.survey);
  if (missing.length) {
    return {
      ok: false,
      error: `Faltan campos obligatorios: ${missing.join(", ")}.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("finalizar_relevamiento");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/relevamiento");
  return { ok: true };
}
