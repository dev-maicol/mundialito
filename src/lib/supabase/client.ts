"use client";

import { createBrowserClient } from "@supabase/ssr";

// 400 días (máximo que aceptan los navegadores). Hace que las cookies de sesión
// sean persistentes y no se borren al cerrar el navegador.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

// Cliente de Supabase para componentes del navegador.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { maxAge: COOKIE_MAX_AGE } },
  );
}
