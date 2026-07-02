-- ============================================================
-- 0013_claim_unseen_points.sql
-- Reclama (marca como visto) y DEVUELVE los puntos no celebrados en UNA sola
-- operación atómica. Reemplaza el enfoque "leer y luego marcar" que tenía una
-- condición de carrera (el confeti se repetía y reducía de a uno).
-- ============================================================

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

-- Limpia el estado actual: marca todo lo ya puntuado como visto (clean slate),
-- así no se vuelve a celebrar lo histórico. De acá en más, solo lo nuevo.
update public.bets set points_seen = true where points_awarded is not null;
