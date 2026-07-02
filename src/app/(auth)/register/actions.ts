"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail, validateEmail, BRANCHES } from "@/lib/account";

export type RegisterResult = { ok: true } | { ok: false; error: string };

// Verifica el código de registro contra app_settings (case-insensitive).
// Si no hay código configurado (vacío), el registro queda abierto → true.
export async function verifyRegisterCode(code: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("register_code")
    .eq("id", 1)
    .single();
  const required = ((data?.register_code as string | null) ?? "").trim();
  if (!required) return true;
  return (code ?? "").trim().toLowerCase() === required.toLowerCase();
}

export type RegisterInput = {
  code: string;
  email: string;
  password: string;
  full_name: string; // nick / apodo
  branch: string; // sucursal
  emoji: string;
};

// Registro de un nuevo apostador. Crea el usuario con la service_role y
// `email_confirm: true`: queda CONFIRMADO sin enviar ningún correo (así no
// dependemos de un SMTP ni del límite de mails del built-in de Supabase). El
// trigger `handle_new_user` crea el perfil en estado 'pendiente'; el admin lo
// aprueba después. La validación real ocurre acá, en el servidor.
export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const email = normalizeEmail(input.email ?? "");
  const invalidEmail = validateEmail(email);
  if (invalidEmail) return { ok: false, error: invalidEmail };

  const password = input.password ?? "";
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const fullName = (input.full_name ?? "").trim();
  if (!fullName) return { ok: false, error: "Ingresá tu nick o apodo." };

  const branch = input.branch ?? "";
  if (!BRANCHES.includes(branch as (typeof BRANCHES)[number])) {
    return { ok: false, error: "Elegí una sucursal válida." };
  }

  const admin = createAdminClient();

  // Código de registro: si hay uno configurado en app_settings, debe coincidir
  // (case-insensitive). Si está vacío, el registro queda abierto.
  const { data: settings } = await admin
    .from("app_settings")
    .select("register_code")
    .eq("id", 1)
    .single();
  const requiredCode = ((settings?.register_code as string | null) ?? "").trim();
  if (requiredCode) {
    const given = (input.code ?? "").trim();
    if (given.toLowerCase() !== requiredCode.toLowerCase()) {
      return { ok: false, error: "Código de registro inválido." };
    }
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirmado sin enviar mail
    user_metadata: {
      full_name: fullName,
      branch,
      emoji: input.emoji || "⚽",
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return { ok: false, error: "Ese correo ya está registrado." };
    }
    return { ok: false, error: error.message };
  }

  // Éxito: redirigimos desde el servidor (más robusto que el router del cliente).
  // `redirect` lanza, así que el cliente sólo recibe un retorno en caso de error.
  redirect("/login?registered=1");
}
