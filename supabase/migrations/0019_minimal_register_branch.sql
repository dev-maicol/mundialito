-- ============================================================
-- 0019_minimal_register_branch.sql
-- Registro mínimo (fork "trabajadores DMO"). El alta pide solo nick + sucursal
-- + correo + contraseña; TODO el resto de los datos personales se recolecta en
-- el relevamiento posterior (employee_records).
--   • profiles: se quitan los campos "salud"; work_city → branch (sucursal).
--   • birth_date y celular personal pasan a employee_records (sección 1).
--   • Trigger handle_new_user copia solo email, full_name (nick), branch, emoji.
-- ============================================================

-- ---------- profiles: quitar campos que ahora van en el relevamiento ----------
-- (Dropear work_city también elimina su CHECK profiles_work_city_chk.)
alter table public.profiles
  drop column if exists birth_date,
  drop column if exists phone,
  drop column if exists work_city,
  drop column if exists hospital,
  drop column if exists specialty,
  drop column if exists sub_specialty,
  drop column if exists is_resident,
  drop column if exists residency_year,
  drop column if exists reference_phone;

-- ---------- profiles: sucursal (branch) ----------
alter table public.profiles
  add column if not exists branch text;

alter table public.profiles drop constraint if exists profiles_branch_chk;
alter table public.profiles
  add constraint profiles_branch_chk check (
    branch is null or branch in (
      'Central', 'Oruro', 'La Paz', 'Cochabamba', 'Santa Cruz', 'Sucre', 'Potosí'
    )
  );

-- ---------- Trigger de alta: solo lo mínimo ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, branch, emoji)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'branch', ''),
    coalesce(nullif(new.raw_user_meta_data->>'emoji', ''), '⚽')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------- employee_records: nacimiento y celular personal ----------
alter table public.employee_records
  add column if not exists birth_date date,
  add column if not exists phone      text;
