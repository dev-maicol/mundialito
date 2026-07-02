-- ============================================================
-- 0015_resident_fields.sql
-- Sub especialidad (texto libre, opcional), ¿es residente? (sí/no) y
-- año de residencia (texto libre, solo si es residente).
-- Ejecutalo en el SQL Editor para aplicarlo a una base ya existente.
-- ============================================================

alter table public.profiles
  add column if not exists sub_specialty  text    not null default '',
  add column if not exists is_resident    boolean not null default false,
  add column if not exists residency_year text;

-- Trigger actualizado: copia los nuevos campos desde el metadata del signup.
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
