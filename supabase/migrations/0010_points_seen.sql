-- ============================================================
-- 0010_points_seen.sql
-- Marca, en la BASE, qué apuestas ya "celebró" el apostador, para que el
-- confeti salga SOLO con los puntos recién asignados (no con históricos).
-- ============================================================

alter table public.bets
  add column if not exists points_seen boolean not null default false;

-- Histórico: lo ya puntuado se considera ya visto (no se celebra de nuevo).
update public.bets set points_seen = true where points_awarded is not null;

-- award_points: al puntuar por primera vez una apuesta, la marca como NO vista
-- (para que dispare el confeti). Una corrección posterior no la "re-celebra".
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
      if pred_sign = real_sign then pts := pts + 3; end if;
      if b.predicted_home = m.home_score_90 and b.predicted_away = m.away_score_90 then pts := pts + 2; end if;

    else
      if b.predicted_winner_team_id is not null
         and b.predicted_winner_team_id = m.winner_team_id then
        pts := pts + 3;
      end if;
      if b.predicted_home = m.home_score_90 and b.predicted_away = m.away_score_90 then
        pts := pts + 2;
      end if;
      if m.decided_by in ('prorroga', 'penales')
         and m.home_score_90 = m.away_score_90
         and b.predicted_home = b.predicted_away
         and b.predicted_decision is not null
         and b.predicted_decision::text = m.decided_by::text then
        pts := pts + 1;
      end if;
    end if;

    update public.bets set
      points_awarded = pts,
      points_seen = case when points_awarded is null then false else points_seen end
    where id = b.id;
  end loop;
end;
$$;

-- Marca como vistas las apuestas puntuadas del usuario actual (tras celebrar).
create or replace function public.mark_points_seen()
returns void language sql security definer set search_path = public as $$
  update public.bets
  set points_seen = true
  where user_id = auth.uid()
    and points_awarded is not null
    and points_seen = false;
$$;

grant execute on function public.mark_points_seen() to authenticated;
