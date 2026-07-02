-- ============================================================
-- 0005_auto_open_close.sql — Apertura y cierre automático de apuestas
-- ============================================================
--
-- Cada minuto:
--   * 'programado' -> 'abierto'  cuando faltan <= X horas para el kickoff.
--   * 'abierto'    -> 'cerrado'  cuando el partido ya empezó.
-- El admin conserva el control manual (puede abrir antes o cerrar antes; un
-- partido cerrado a mano NO se vuelve a abrir solo). Las apuestas igual quedan
-- bloqueadas por RLS en el kickoff, así que el cierre es a prueba de fallas.
--
-- Reemplaza al job de solo-cierre de 0004 (lo desprograma si existía).
-- Requiere la extensión pg_cron (Supabase: Database -> Extensions -> pg_cron).

create extension if not exists pg_cron;

-- ---------- Configuración: horas antes del kickoff para abrir ----------
create table if not exists public.app_settings (
  id                    int  primary key default 1,
  bet_open_hours_before int  not null default 5,
  register_code         text not null default 'DMO2026',  -- código para registrarse (vacío = abierto)
  constraint app_settings_singleton check (id = 1)
);
insert into public.app_settings (id) values (1) on conflict do nothing;

alter table public.app_settings enable row level security;

drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings
  for select using (public.is_admin());

drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update on public.app_settings
  for update using (public.is_super_admin()) with check (public.is_super_admin());

grant select, update on public.app_settings to authenticated;

-- ---------- Función que abre y cierra según la hora ----------
create or replace function public.refresh_match_states()
returns void language plpgsql security definer set search_path = public as $$
declare
  h int;
begin
  select bet_open_hours_before into h from public.app_settings where id = 1;
  h := coalesce(h, 5);

  -- Abrir los que entran en la ventana y todavía no empezaron.
  update public.matches
  set status = 'abierto'
  where status = 'programado'
    and now() >= kickoff_at - make_interval(hours => h)
    and now() <  kickoff_at;

  -- Cerrar los que ya empezaron.
  update public.matches
  set status = 'cerrado'
  where status = 'abierto'
    and now() >= kickoff_at;
end;
$$;

revoke execute on function public.refresh_match_states() from public, anon, authenticated;

-- ---------- Programar el job cada minuto ----------
-- Desprograma el job viejo de solo-cierre (de 0004), si existe.
select cron.unschedule('close-expired-matches')
where exists (select 1 from cron.job where jobname = 'close-expired-matches');

-- (Re)programa el job unificado.
select cron.unschedule('refresh-match-states')
where exists (select 1 from cron.job where jobname = 'refresh-match-states');

select cron.schedule(
  'refresh-match-states',
  '* * * * *',
  $$ select public.refresh_match_states(); $$
);
