-- ============================================================
-- 0004_auto_close.sql — (OPCIONAL) Cierre automático del rótulo de estado
-- ============================================================
--
-- Las apuestas YA se cierran en el kickoff por RLS (nadie puede apostar
-- después, aunque el partido diga "abierto"). Esta migración es solo
-- cosmética: hace que el ESTADO del partido pase de 'abierto' a 'cerrado'
-- automáticamente, para que el panel de Gestión lo refleje sin intervención.
--
-- Requiere la extensión pg_cron (Supabase: Database -> Extensions -> pg_cron,
-- o la sentencia de abajo). El job corre cada minuto.

create extension if not exists pg_cron;

-- Cierra los partidos cuyo kickoff ya pasó.
create or replace function public.close_expired_matches()
returns void language sql security definer set search_path = public as $$
  update public.matches
  set status = 'cerrado'
  where status = 'abierto' and now() >= kickoff_at;
$$;

-- Programa el job cada minuto (idempotente: re-crea si ya existía).
select cron.unschedule('close-expired-matches')
where exists (select 1 from cron.job where jobname = 'close-expired-matches');

select cron.schedule(
  'close-expired-matches',
  '* * * * *',
  $$ select public.close_expired_matches(); $$
);
