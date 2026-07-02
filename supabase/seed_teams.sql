-- ============================================================
-- seed_teams.sql — Los 48 equipos del Mundial 2026 con grupos y banderas
-- Sorteo final (5 dic 2025). Fuentes: FIFA / Al Jazeera / Wikipedia.
-- Banderas servidas por flagcdn.com (https://flagcdn.com).
--
-- Idempotente: inserta los que falten y corrige grupo/nombre/bandera de los
-- que ya existan. Ejecutalo en el SQL Editor.
-- ============================================================

-- Quita equipos de ejemplo que no juegan el Mundial (si no tienen partidos).
delete from public.teams t
where t.code = 'BOL'
  and not exists (
    select 1 from public.matches m
    where m.home_team_id = t.id or m.away_team_id = t.id
  );

with data(name, code, grp, flag) as (
  values
    -- Grupo A
    ('México','MEX','A','mx'), ('Sudáfrica','RSA','A','za'),
    ('Corea del Sur','KOR','A','kr'), ('República Checa','CZE','A','cz'),
    -- Grupo B
    ('Canadá','CAN','B','ca'), ('Bosnia y Herzegovina','BIH','B','ba'),
    ('Qatar','QAT','B','qa'), ('Suiza','SUI','B','ch'),
    -- Grupo C
    ('Brasil','BRA','C','br'), ('Marruecos','MAR','C','ma'),
    ('Haití','HAI','C','ht'), ('Escocia','SCO','C','gb-sct'),
    -- Grupo D
    ('Estados Unidos','USA','D','us'), ('Paraguay','PAR','D','py'),
    ('Australia','AUS','D','au'), ('Turquía','TUR','D','tr'),
    -- Grupo E
    ('Alemania','GER','E','de'), ('Curazao','CUW','E','cw'),
    ('Costa de Marfil','CIV','E','ci'), ('Ecuador','ECU','E','ec'),
    -- Grupo F
    ('Países Bajos','NED','F','nl'), ('Japón','JPN','F','jp'),
    ('Suecia','SWE','F','se'), ('Túnez','TUN','F','tn'),
    -- Grupo G
    ('Bélgica','BEL','G','be'), ('Egipto','EGY','G','eg'),
    ('Irán','IRN','G','ir'), ('Nueva Zelanda','NZL','G','nz'),
    -- Grupo H
    ('España','ESP','H','es'), ('Cabo Verde','CPV','H','cv'),
    ('Arabia Saudita','KSA','H','sa'), ('Uruguay','URU','H','uy'),
    -- Grupo I
    ('Francia','FRA','I','fr'), ('Senegal','SEN','I','sn'),
    ('Irak','IRQ','I','iq'), ('Noruega','NOR','I','no'),
    -- Grupo J
    ('Argentina','ARG','J','ar'), ('Argelia','ALG','J','dz'),
    ('Austria','AUT','J','at'), ('Jordania','JOR','J','jo'),
    -- Grupo K
    ('Portugal','POR','K','pt'), ('RD Congo','COD','K','cd'),
    ('Uzbekistán','UZB','K','uz'), ('Colombia','COL','K','co'),
    -- Grupo L
    ('Inglaterra','ENG','L','gb-eng'), ('Croacia','CRO','L','hr'),
    ('Ghana','GHA','L','gh'), ('Panamá','PAN','L','pa')
),
norm as (
  select name, code, grp,
         'https://flagcdn.com/w160/' || flag || '.png' as flag_url
  from data
),
upsert as (
  update public.teams t
  set group_label = n.grp, name = n.name, flag_url = n.flag_url
  from norm n
  where t.code = n.code
  returning t.code
)
insert into public.teams (name, code, group_label, flag_url)
select n.name, n.code, n.grp, n.flag_url
from norm n
where n.code not in (select code from upsert);
