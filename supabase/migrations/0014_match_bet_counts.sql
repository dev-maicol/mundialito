-- ============================================================
-- 0014_match_bet_counts.sql
-- Vista con la CANTIDAD de apuestas por partido (solo el número, no expone
-- quién apostó ni qué pronosticó). La usa el badge "Apuestas hasta el momento".
-- ============================================================

create or replace view public.match_bet_counts as
select match_id, count(*)::int as bet_count
from public.bets
group by match_id;

grant select on public.match_bet_counts to anon, authenticated;
