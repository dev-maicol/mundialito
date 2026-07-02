-- ============================================================
-- 0006_ranking_exclude_superadmin.sql
-- Excluye a los super_admin del ranking (vista standings).
-- Ejecutalo en el SQL Editor para aplicarlo a una base ya existente.
-- ============================================================

create or replace view public.standings as
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
