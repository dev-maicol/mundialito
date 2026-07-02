-- ============================================================
-- 0003_functions.sql — Trigger de perfil y cálculo de puntos
-- ============================================================

-- ---------- Crear perfil automáticamente al registrarse ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, email, full_name, birth_date, phone,
    work_city, hospital, specialty, reference_phone, emoji,
    sub_specialty, is_resident, residency_year
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'work_city', ''),
    coalesce(new.raw_user_meta_data->>'hospital', ''),
    coalesce(new.raw_user_meta_data->>'specialty', ''),
    nullif(new.raw_user_meta_data->>'reference_phone', ''),
    coalesce(nullif(new.raw_user_meta_data->>'emoji', ''), '⚽'),
    coalesce(new.raw_user_meta_data->>'sub_specialty', ''),
    coalesce((new.raw_user_meta_data->>'is_resident')::boolean, false),
    nullif(new.raw_user_meta_data->>'residency_year', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Otorgar puntos de un partido finalizado ----------
-- Reglas:
--   GRUPOS (máx 5):       +3 sentido correcto (gana A / empate / gana B)
--                         +2 marcador exacto
--   ELIMINATORIA (máx 6): +3 acertar quién avanza
--                         +2 marcador exacto a los 90'
--                         +1 si hubo empate a los 90' y se acierta la vía
--                            de definición (prórroga / penales)
create or replace function public.award_points(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m         record;
  b         record;
  real_sign int;
  pred_sign int;
  pts       int;
begin
  select * into m from public.matches where id = p_match_id;
  if not found then raise exception 'partido no existe'; end if;
  if m.status <> 'finalizado' then raise exception 'el partido no está finalizado'; end if;
  if m.home_score_90 is null or m.away_score_90 is null then
    raise exception 'el partido no tiene resultado';
  end if;

  real_sign := sign(m.home_score_90 - m.away_score_90);

  for b in select * from public.bets where match_id = p_match_id loop
    pts := 0;

    if m.phase = 'grupos' then
      pred_sign := sign(b.predicted_home - b.predicted_away);
      if pred_sign = real_sign then
        pts := pts + 3;
      end if;
      if b.predicted_home = m.home_score_90 and b.predicted_away = m.away_score_90 then
        pts := pts + 2;
      end if;

    else  -- eliminatoria
      if b.predicted_winner_team_id is not null
         and b.predicted_winner_team_id = m.winner_team_id then
        pts := pts + 3;
      end if;
      if b.predicted_home = m.home_score_90 and b.predicted_away = m.away_score_90 then
        pts := pts + 2;
      end if;
    end if;

    update public.bets set
      points_awarded = pts,
      points_seen = case when points_awarded is null then false else points_seen end
    where id = b.id;
  end loop;
end;
$$;

-- Reclama (marca como visto) y devuelve los puntos no celebrados del usuario
-- actual, en una sola operación atómica (evita condiciones de carrera).
create or replace function public.claim_unseen_points()
returns table (points_awarded int)
language sql security definer set search_path = public as $$
  update public.bets
  set points_seen = true
  where user_id = auth.uid()
    and points_awarded is not null
    and points_seen = false
  returning points_awarded;
$$;

grant execute on function public.claim_unseen_points() to authenticated;

-- award_points solo se invoca internamente desde set_match_result.
revoke execute on function public.award_points(uuid) from public, anon, authenticated;

-- ---------- Cargar resultado y otorgar puntos (RPC para admins) ----------
create or replace function public.set_match_result(
  p_match_id   uuid,
  p_home       int,
  p_away       int,
  p_winner     uuid              default null,
  p_decided_by public.match_decision default 'regular'
)
returns void language plpgsql security definer set search_path = public as $$
declare
  m record;
begin
  if not public.is_admin() then
    raise exception 'no autorizado';
  end if;

  select * into m from public.matches where id = p_match_id;
  if not found then raise exception 'partido no existe'; end if;

  -- Resguardo: un partido ya finalizado solo lo puede corregir un super_admin.
  if m.status = 'finalizado' and not public.is_super_admin() then
    raise exception 'El resultado de este partido ya fue cargado.';
  end if;

  if p_home < 0 or p_away < 0 then
    raise exception 'marcador inválido';
  end if;

  if m.phase = 'eliminatoria' then
    if p_winner is null then
      raise exception 'debe indicar el equipo que avanza';
    end if;
    if p_winner <> m.home_team_id and p_winner <> m.away_team_id then
      raise exception 'el equipo que avanza no corresponde a este partido';
    end if;
  end if;

  update public.matches set
    home_score_90  = p_home,
    away_score_90  = p_away,
    winner_team_id = case when m.phase = 'eliminatoria' then p_winner    else null end,
    decided_by     = case when m.phase = 'eliminatoria' then p_decided_by else null end,
    status         = 'finalizado',
    result_set_by  = auth.uid(),
    result_set_at  = now()
  where id = p_match_id;

  perform public.award_points(p_match_id);
end;
$$;

grant execute on function public.set_match_result(uuid, int, int, uuid, public.match_decision)
  to authenticated;
