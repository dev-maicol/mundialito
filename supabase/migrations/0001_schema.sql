-- ============================================================
-- 0001_schema.sql — Enums, tablas y vista del ranking
-- Sistema de apuestas del Mundial
-- ============================================================

-- ---------- Enums ----------
-- Nota: 'gerencia' se agregó en 0018 (lee relevamiento/reclamos; no gestiona la
-- quiniela). En una instalación nueva ya queda en el enum desde acá.
create type public.user_role     as enum ('super_admin', 'admin', 'gerencia', 'apostador');
create type public.user_status   as enum ('pendiente', 'aprobado', 'rechazado');
create type public.match_phase   as enum ('grupos', 'eliminatoria');
create type public.match_status  as enum ('programado', 'abierto', 'cerrado', 'finalizado');
create type public.match_decision as enum ('regular', 'prorroga', 'penales');
create type public.bet_decision   as enum ('prorroga', 'penales');

-- ---------- profiles (1:1 con auth.users) ----------
-- El usuario inicia sesión con su CORREO real (es el email de Supabase Auth).
-- El nombre completo (full_name) es el identificador visible en la app.
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null default '',   -- correo real: login + contacto
  full_name       text not null default '',   -- nombre completo (display)
  birth_date      date,                        -- fecha de nacimiento
  phone           text not null default '',    -- celular
  work_city       text,                        -- ciudad/departamento donde trabaja
  hospital        text not null default '',    -- hospital/clínica donde trabaja
  specialty       text not null default '',    -- especialidad médica (texto libre)
  sub_specialty   text not null default '',    -- sub especialidad (texto libre, opcional)
  is_resident     boolean not null default false, -- ¿es residente?
  residency_year  text,                        -- año de residencia (si es residente)
  reference_phone text,                        -- celular de referencia (opcional)
  emoji           text not null default '⚽',  -- avatar opcional
  role            public.user_role   not null default 'apostador',
  status          public.user_status not null default 'pendiente',
  must_change_password boolean not null default false,
  created_at      timestamptz not null default now(),
  -- La ciudad de trabajo debe ser uno de los 9 departamentos de Bolivia.
  constraint profiles_work_city_chk check (
    work_city is null or work_city in (
      'La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí',
      'Chuquisaca', 'Tarija', 'Beni', 'Pando'
    )
  )
);

-- Correo único (case-insensitive) entre los perfiles ya registrados.
-- (Auth ya garantiza unicidad del email; este índice protege la ficha.)
create unique index profiles_email_key
  on public.profiles (lower(email))
  where email <> '';

-- ---------- teams ----------
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null,
  group_label text,
  flag_url    text,
  created_at  timestamptz not null default now()
);

-- ---------- matches ----------
create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  phase          public.match_phase  not null default 'grupos',
  round_label    text,
  home_team_id   uuid not null references public.teams(id),
  away_team_id   uuid not null references public.teams(id),
  kickoff_at     timestamptz not null,
  status         public.match_status not null default 'programado',
  -- Resultado real (marcador a los 90')
  home_score_90  int,
  away_score_90  int,
  -- Solo eliminatoria
  winner_team_id uuid references public.teams(id),
  decided_by     public.match_decision,
  -- Auditoría de la carga del resultado
  result_set_by  uuid references public.profiles(id),
  result_set_at  timestamptz,
  created_at     timestamptz not null default now(),
  constraint matches_distinct_teams check (home_team_id <> away_team_id)
);

create index matches_kickoff_idx on public.matches (kickoff_at);
create index matches_status_idx  on public.matches (status);

-- ---------- bets (apuesta única e inmutable) ----------
create table public.bets (
  id                       uuid primary key default gen_random_uuid(),
  match_id                 uuid not null references public.matches(id) on delete cascade,
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  -- Pronóstico del marcador a los 90'
  predicted_home           int not null check (predicted_home >= 0),
  predicted_away           int not null check (predicted_away >= 0),
  -- Solo eliminatoria
  predicted_winner_team_id uuid references public.teams(id),
  predicted_decision       public.bet_decision,
  -- Puntos otorgados (null hasta que el partido se finalice)
  points_awarded           int,
  -- Si el apostador ya "vio" (celebró) estos puntos
  points_seen              boolean not null default false,
  created_at               timestamptz not null default now(),
  unique (match_id, user_id)
);

create index bets_match_idx on public.bets (match_id);
create index bets_user_idx  on public.bets (user_id);

-- ---------- Vista de ranking global ----------
-- Aggrega puntos por usuario. Es una vista security-definer (default) para
-- poder sumar las apuestas de todos los usuarios en el leaderboard público;
-- solo expone columnas agregadas no sensibles.
create view public.standings as
select
  p.id                                                            as user_id,
  p.full_name,
  p.emoji,
  coalesce(sum(b.points_awarded), 0)                             as total_points,
  count(b.id) filter (where b.points_awarded is not null)        as graded_bets,
  count(b.id) filter (where coalesce(b.points_awarded, 0) > 0)   as hits
from public.profiles p
left join public.bets b on b.user_id = p.id
where p.status = 'aprobado' and p.role <> 'super_admin'
group by p.id, p.full_name, p.emoji;
