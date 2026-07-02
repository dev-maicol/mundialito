// Helpers de cuenta: el login es por CORREO real (es el email de Supabase Auth)
// y el nombre completo es el identificador visible en la app.

// Sucursales de la empresa: opciones válidas para "sucursal" en el registro.
// Deben coincidir con el CHECK profiles_branch_chk (migración 0019).
export const BRANCHES = [
  "Central",
  "Oruro",
  "La Paz",
  "Cochabamba",
  "Santa Cruz",
  "Sucre",
  "Potosí",
] as const;

export type Branch = (typeof BRANCHES)[number];

// Normaliza el correo (minúsculas, sin espacios).
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// Valida el formato del correo. Devuelve null si es válido, o un mensaje de error.
// (No verifica que exista; solo el formato. La confirmación por mail se puede
//  activar más adelante en Supabase con un SMTP propio.)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email)) {
    return "Ingresá un correo válido (ej. nombre@dominio.com).";
  }
  return null;
}
