-- ============================================================
-- reset_test_data.sql — Dejar el sistema "en limpio" para una nueva prueba
-- ============================================================
-- ⚠️ DESTRUCTIVO E IRREVERSIBLE. Ejecutar en el SQL Editor de Supabase.
--    Conserva: tu cuenta admin (super_admin), los 48 equipos y los 72
--    partidos oficiales del seed. Cada bloque es independiente: comentá los
--    que no quieras ejecutar.
-- ============================================================

-- 1) Borra TODAS las apuestas (deja los puntajes en cero).
delete from public.bets;

-- 2) Resetea TODOS los partidos: vuelven a 'programado' y sin resultado.
update public.matches
set status         = 'programado',
    home_score_90  = null,
    away_score_90  = null,
    winner_team_id = null,
    decided_by     = null;

-- 3) (OPCIONAL) Borra los partidos que creaste a mano en las pruebas.
--    Los oficiales del seed tienen round_label tipo 'Grupo X'; los de prueba no.
delete from public.matches
where round_label is null or round_label not like 'Grupo %';

-- 4) (OPCIONAL) Borra los usuarios de prueba por correo. Elimina también sus
--    perfiles y apuestas en cascada. NO toca tu cuenta admin.
delete from auth.users
where id in (
  select id from public.profiles
  where lower(email) in ('sergio@ejemplo.com', 'daniela@ejemplo.com')
);

-- ---- (Alternativa al bloque 4) Borrar TODOS los usuarios menos los admins:
-- delete from auth.users
-- where id in (
--   select id from public.profiles where role = 'apostador'
-- );

-- 5) Verificación del estado final.
select
  (select count(*) from public.teams)                         as equipos,
  (select count(*) from public.matches)                       as partidos,
  (select count(*) from public.bets)                          as apuestas,
  (select count(*) from public.profiles)                      as usuarios,
  (select count(*) from public.profiles where role = 'super_admin') as super_admins;
