-- ============================================================
-- seed_matches_r32.sql — 16avos de final (Ronda de 32) del Mundial 2026
-- Horarios en hora de Bolivia (UTC-4 = ET/EDT en estas fechas).
-- Fuente: SI.com / Yahoo. Fase 'eliminatoria', round_label '16avos'.
--
-- Requiere haber corrido antes `seed_teams.sql` (busca los equipos por código).
-- Idempotente: no duplica un partido con el mismo local y visitante.
-- Los partidos quedan en estado 'programado'; se abren solos según la ventana
-- de Configuración (o a mano desde Gestión).
-- ============================================================

insert into public.matches (home_team_id, away_team_id, phase, round_label, kickoff_at, status)
select ht.id, at.id, 'eliminatoria', '16avos', v.kickoff::timestamptz, 'programado'
from (values
  ('CAN','RSA','2026-06-28 15:00-04'),
  ('BRA','JPN','2026-06-29 13:00-04'),
  ('GER','PAR','2026-06-29 16:30-04'),
  ('NED','MAR','2026-06-29 21:00-04'),
  ('NOR','CIV','2026-06-30 13:00-04'),
  ('FRA','SWE','2026-06-30 17:00-04'),
  ('MEX','ECU','2026-06-30 21:00-04'),
  ('ENG','COD','2026-07-01 12:00-04'),
  ('BEL','SEN','2026-07-01 16:00-04'),
  ('USA','BIH','2026-07-01 20:00-04'),
  ('ESP','AUT','2026-07-02 15:00-04'),
  ('POR','CRO','2026-07-02 19:00-04'),
  ('SUI','ALG','2026-07-02 23:00-04'),
  ('AUS','EGY','2026-07-03 14:00-04'),
  ('ARG','CPV','2026-07-03 18:00-04'),
  ('COL','GHA','2026-07-03 21:30-04')
) as v(home, away, kickoff)
join public.teams ht on ht.code = v.home
join public.teams at on at.code = v.away
where not exists (
  select 1 from public.matches m
  where m.home_team_id = ht.id and m.away_team_id = at.id
);
