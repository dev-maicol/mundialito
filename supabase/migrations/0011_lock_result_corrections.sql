-- ============================================================
-- 0011_lock_result_corrections.sql
-- Un partido ya finalizado solo lo puede corregir un super_admin.
-- Un admin común puede cargar el PRIMER resultado, pero no sobrescribir.
-- ============================================================

create or replace function public.set_match_result(
  p_match_id   uuid,
  p_home       int,
  p_away       int,
  p_winner     uuid                  default null,
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
