-- ============================================================
-- 0017_register_code.sql
-- Código de registro: para registrarse hay que ingresar este código (se valida
-- en el servidor en registerUser). Si está vacío, el registro queda abierto.
-- Editable por el super_admin desde /admin/configuracion.
-- Valor inicial 'DMO2026' (cambialo desde Configuración).
-- Ejecutalo en el SQL Editor para aplicarlo a una base ya existente.
-- ============================================================

alter table public.app_settings
  add column if not exists register_code text not null default 'DMO2026';
