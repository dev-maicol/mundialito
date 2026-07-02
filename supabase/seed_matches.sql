-- ============================================================
-- seed_matches.sql — Los 72 partidos de la fase de grupos (Mundial 2026)
-- Calendario oficial. Fuente de horarios: Sky Sports (hora británica, BST).
--
-- Los horarios se guardan con offset +01 (BST = UTC+1 durante junio); Postgres
-- los convierte a UTC automáticamente y la app los muestra en hora de Bolivia.
-- El grupo (round_label) se deriva del grupo de los equipos.
--
-- Requiere haber corrido antes `seed_teams.sql` (busca los equipos por código).
-- Idempotente: no duplica un partido con el mismo local y visitante.
-- Nota: los partidos de eliminatoria se crean a mano cuando se conozcan los
-- clasificados.
-- ============================================================

insert into public.matches (home_team_id, away_team_id, phase, round_label, kickoff_at, status)
select ht.id, at.id, 'grupos', 'Grupo ' || ht.group_label, v.kickoff::timestamptz, 'programado'
from (values
  -- Fecha 1
  ('MEX','RSA','2026-06-11 20:00+01'),
  ('KOR','CZE','2026-06-12 03:00+01'),
  ('CAN','BIH','2026-06-12 20:00+01'),
  ('USA','PAR','2026-06-13 02:00+01'),
  ('QAT','SUI','2026-06-13 20:00+01'),
  ('BRA','MAR','2026-06-13 23:00+01'),
  ('HAI','SCO','2026-06-14 02:00+01'),
  ('AUS','TUR','2026-06-14 05:00+01'),
  ('GER','CUW','2026-06-14 18:00+01'),
  ('NED','JPN','2026-06-14 21:00+01'),
  ('CIV','ECU','2026-06-15 00:00+01'),
  ('SWE','TUN','2026-06-15 03:00+01'),
  ('ESP','CPV','2026-06-15 17:00+01'),
  ('BEL','EGY','2026-06-15 20:00+01'),
  ('KSA','URU','2026-06-15 23:00+01'),
  ('IRN','NZL','2026-06-16 02:00+01'),
  ('FRA','SEN','2026-06-16 20:00+01'),
  ('IRQ','NOR','2026-06-16 23:00+01'),
  ('ARG','ALG','2026-06-17 02:00+01'),
  ('AUT','JOR','2026-06-17 05:00+01'),
  ('POR','COD','2026-06-17 18:00+01'),
  ('ENG','CRO','2026-06-17 21:00+01'),
  ('GHA','PAN','2026-06-18 00:00+01'),
  ('UZB','COL','2026-06-18 03:00+01'),
  -- Fecha 2
  ('CZE','RSA','2026-06-18 17:00+01'),
  ('SUI','BIH','2026-06-18 20:00+01'),
  ('CAN','QAT','2026-06-18 23:00+01'),
  ('MEX','KOR','2026-06-19 02:00+01'),
  ('USA','AUS','2026-06-19 20:00+01'),
  ('SCO','MAR','2026-06-19 23:00+01'),
  ('BRA','HAI','2026-06-20 01:30+01'),
  ('TUR','PAR','2026-06-20 04:00+01'),
  ('NED','SWE','2026-06-20 18:00+01'),
  ('GER','CIV','2026-06-20 21:00+01'),
  ('ECU','CUW','2026-06-21 01:00+01'),
  ('TUN','JPN','2026-06-21 05:00+01'),
  ('ESP','KSA','2026-06-21 17:00+01'),
  ('BEL','IRN','2026-06-21 20:00+01'),
  ('URU','CPV','2026-06-21 23:00+01'),
  ('NZL','EGY','2026-06-22 02:00+01'),
  ('ARG','AUT','2026-06-22 18:00+01'),
  ('FRA','IRQ','2026-06-22 22:00+01'),
  ('NOR','SEN','2026-06-23 01:00+01'),
  ('JOR','ALG','2026-06-23 04:00+01'),
  ('POR','UZB','2026-06-23 18:00+01'),
  ('ENG','GHA','2026-06-23 21:00+01'),
  ('PAN','CRO','2026-06-24 00:00+01'),
  ('COL','COD','2026-06-24 03:00+01'),
  -- Fecha 3
  ('SUI','CAN','2026-06-24 20:00+01'),
  ('BIH','QAT','2026-06-24 20:00+01'),
  ('MAR','HAI','2026-06-24 23:00+01'),
  ('SCO','BRA','2026-06-24 23:00+01'),
  ('RSA','KOR','2026-06-25 02:00+01'),
  ('CZE','MEX','2026-06-25 02:00+01'),
  ('CUW','CIV','2026-06-25 21:00+01'),
  ('ECU','GER','2026-06-25 21:00+01'),
  ('TUN','NED','2026-06-26 00:00+01'),
  ('JPN','SWE','2026-06-26 00:00+01'),
  ('TUR','USA','2026-06-26 03:00+01'),
  ('PAR','AUS','2026-06-26 03:00+01'),
  ('NOR','FRA','2026-06-26 20:00+01'),
  ('SEN','IRQ','2026-06-26 20:00+01'),
  ('CPV','KSA','2026-06-27 01:00+01'),
  ('URU','ESP','2026-06-27 01:00+01'),
  ('NZL','BEL','2026-06-27 04:00+01'),
  ('EGY','IRN','2026-06-27 04:00+01'),
  ('PAN','ENG','2026-06-27 22:00+01'),
  ('CRO','GHA','2026-06-27 22:00+01'),
  ('COL','POR','2026-06-28 00:30+01'),
  ('COD','UZB','2026-06-28 00:30+01'),
  ('ALG','AUT','2026-06-28 03:00+01'),
  ('JOR','ARG','2026-06-28 03:00+01')
) as v(home, away, kickoff)
join public.teams ht on ht.code = v.home
join public.teams at on at.code = v.away
where not exists (
  select 1 from public.matches m
  where m.home_team_id = ht.id and m.away_team_id = at.id
);
