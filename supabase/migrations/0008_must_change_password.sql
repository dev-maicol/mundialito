-- ============================================================
-- 0008_must_change_password.sql
-- Marca para forzar al usuario a cambiar su contraseña en el próximo ingreso
-- (lo usa el super admin al restablecer una contraseña olvidada).
-- ============================================================

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;
