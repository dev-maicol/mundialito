-- ============================================================
-- 0016_knockout_scoring.sql
-- Eliminatoria: puntaje simplificado.
--   +3 acertar el equipo que avanza
--   +2 marcador exacto a los 90'
-- (se quita el bonus de +1 por prórroga/penales; ahora máx 5, igual que grupos)
-- Grupos no cambia.
-- Ejecutalo en el SQL Editor para aplicarlo a una base ya existente.
-- ============================================================

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
