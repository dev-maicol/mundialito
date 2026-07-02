-- ============================================================
-- 0002_rls.sql — Funciones helper de rol y políticas RLS
-- ============================================================

-- ---------- Helpers (security definer para evitar recursión en RLS) ----------
create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'aprobado'
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
      and role = 'super_admin'
  );
$$;

-- ---------- Activar RLS ----------
alter table public.profiles enable row level security;
alter table public.teams    enable row level security;
alter table public.matches  enable row level security;
alter table public.bets     enable row level security;

-- ---------- profiles ----------
-- Cada quien ve su perfil; los admins ven todos.
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- super_admin puede modificar cualquier perfil (incluye otorgar super_admin).
create policy profiles_update_super on public.profiles
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- admin puede aprobar/rechazar y gestionar perfiles que NO sean super_admin,
-- y no puede ascender a nadie a super_admin.
create policy profiles_update_admin on public.profiles
  for update
  using (public.is_admin() and role <> 'super_admin')
  with check (role <> 'super_admin');

-- (INSERT lo hace el trigger handle_new_user; no hay DELETE de perfiles.)

-- ---------- teams ----------
create policy teams_select on public.teams
  for select using (public.is_approved());

create policy teams_write on public.teams
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- matches ----------
create policy matches_select on public.matches
  for select using (public.is_approved());

-- super_admin crea y elimina partidos.
create policy matches_insert on public.matches
  for insert with check (public.is_super_admin());

create policy matches_delete on public.matches
  for delete using (public.is_super_admin());

-- admin (y super_admin) cambian estado y cargan resultado.
create policy matches_update on public.matches
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- bets ----------
-- El usuario ve sus apuestas; los admins ven todas.
create policy bets_select on public.bets
  for select using (user_id = auth.uid() or public.is_admin());

-- INSERT solo si: es la propia apuesta, usuario aprobado, partido ABIERTO y
-- antes del kickoff. El UNIQUE(match_id,user_id) garantiza una sola apuesta.
create policy bets_insert on public.bets
  for insert with check (
    user_id = auth.uid()
    and public.is_approved()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.status = 'abierto'
        and now() < m.kickoff_at
    )
  );

-- Sin políticas de UPDATE/DELETE para usuarios => apuesta inmutable.
-- (award_points actualiza points_awarded vía función security definer.)

-- ---------- Grants (RLS sigue aplicando encima) ----------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
