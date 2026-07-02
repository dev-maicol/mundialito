-- ============================================================
-- 0012_match_predictions_order.sql
-- Devuelve los pronósticos en el ORDEN en que se hicieron las apuestas
-- (created_at) y agrega user_id para poder resaltar la apuesta propia.
-- ============================================================

drop function if exists public.match_predictions(uuid);

create function public.match_predictions(p_match_id uuid)
returns table (
  user_id                  uuid,
  full_name                text,
  emoji                    text,
  predicted_home           int,
  predicted_away           int,
  predicted_winner_team_id uuid,
  predicted_decision       public.bet_decision,
  points_awarded           int
)
language plpgsql stable security definer set search_path = public as $$
declare
  m record;
begin
  if not public.is_approved() then
    raise exception 'no autorizado';
  end if;

  select * into m from public.matches where id = p_match_id;
  if not found then
    raise exception 'partido no existe';
  end if;

  if not (m.status in ('cerrado', 'finalizado') or now() >= m.kickoff_at) then
    raise exception 'las apuestas siguen abiertas';
  end if;

  return query
    select
      b.user_id,
      p.full_name,
      p.emoji,
      b.predicted_home,
      b.predicted_away,
      b.predicted_winner_team_id,
      b.predicted_decision,
      b.points_awarded
    from public.bets b
    join public.profiles p on p.id = b.user_id
    where b.match_id = p_match_id
    order by b.created_at asc;
end;
$$;

grant execute on function public.match_predictions(uuid) to authenticated;
