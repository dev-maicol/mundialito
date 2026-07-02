-- ============================================================
-- 0018_employee_records.sql
-- Módulo de "Regularización de datos del personal" + buzón de reclamos.
--   • Nuevo rol `gerencia` (lee relevamiento y reclamos; NO gestiona la quiniela).
--   • employee_records (+ children/assets): ficha por trabajador, con estado
--     borrador → finalizado (finalizado bloquea al trabajador; Gerencia reabre).
--   • Buzón de reclamos ANÓNIMO: al finalizar se corta el vínculo con la
--     identidad (el texto va a `complaints` SIN user_id); `complaint_submissions`
--     guarda solo "este usuario ya envió" para el tope de 1 por persona.
--
-- ⚠️ IMPORTANTE (Postgres): `alter type ... add value` no puede USARSE en la
-- misma transacción en que se agrega. Si el SQL Editor de Supabase corre todo
-- como una sola transacción y falla con "unsafe use of new value", ejecutá
-- PRIMERO solo el bloque "PASO 1" y luego el resto del archivo.
-- (En una instalación nueva, 0001 ya crea el enum con 'gerencia' y este ADD es
--  un no-op gracias a IF NOT EXISTS.)
-- ============================================================

-- ---------- PASO 1: nuevo valor del enum de roles ----------
alter type public.user_role add value if not exists 'gerencia';

-- ---------- PASO 2: helper de lectura de datos de RRHH ----------
-- gerencia y super_admin pueden leer el relevamiento y los reclamos.
-- (plpgsql para no evaluar el literal del enum al crear la función; así es
--  seguro aunque corra en la misma transacción que el ADD VALUE de arriba.)
create or replace function public.is_gerencia()
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
      and role in ('gerencia', 'super_admin')
  );
end;
$$;

-- ============================================================
-- TABLAS
-- ============================================================

-- ---------- employee_records: ficha (1:1 con el trabajador) ----------
create table if not exists public.employee_records (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status  text not null default 'borrador'
          check (status in ('borrador', 'finalizado')),

  -- --- Sección 1: datos personales y familiares ---
  first_names       text,          -- nombres (obligatorio al finalizar)
  last_name_p       text,          -- apellido paterno (opcional)
  last_name_m       text,          -- apellido materno (opcional)
  ci_number         text,          -- carnet de identidad
  ci_ext            text,          -- lugar de expedición
  residence_city    text,          -- ciudad de residencia actual
  home_address      text,          -- domicilio actual
  marital_status    text,          -- estado civil
  emergency_name    text,          -- contacto de emergencia (nombre)
  emergency_phone   text,          -- contacto de emergencia (teléfono)
  has_dependents    boolean,       -- ¿personas que dependan económicamente?
  dependents_detail text,          -- detalle de dependientes
  shirt_size        text,          -- talla de polera/chaqueta/uniforme
  health_condition  text,          -- condición de salud (voluntario, reservado)

  -- --- Sección 2: datos laborales y contractuales ---
  hire_date         date,          -- fecha de ingreso
  start_branch      text,          -- ciudad/sucursal donde inició
  start_position    text,          -- puesto con el que empezó
  current_position  text,          -- puesto actual
  department        text,          -- área o departamento
  immediate_boss    text,          -- jefe inmediato actual
  prior_roles       text,          -- otros cargos dentro de la empresa
  has_contract      boolean,       -- ¿tiene contrato firmado?
  contract_type     text,          -- tipo de contrato
  no_contract_since text,          -- si no tiene contrato, desde cuándo
  has_memo          boolean,       -- ¿memorándum / designación formal?
  knows_duties      boolean,       -- ¿conoce sus funciones?
  received_manual   boolean,       -- ¿recibió manual de funciones?
  duties_match      boolean,       -- ¿funciones coinciden con el cargo?
  staff_in_charge   text,          -- personal a cargo (nombres/cargos)

  -- --- Secciones 3, 4, 5, 6, 7 (texto abierto / encuesta / inventario) ---
  -- Respuestas keyed por id de pregunta (ver src/lib/relevamiento.ts).
  survey_answers    jsonb not null default '{}'::jsonb,

  updated_at        timestamptz not null default now(),
  finalized_at      timestamptz
);

-- ---------- employee_children: hijos (lista repetible) ----------
create table if not exists public.employee_children (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.employee_records(user_id) on delete cascade,
  name    text not null default '',
  age     text not null default ''   -- texto libre (ej. "3 años")
);
create index if not exists employee_children_user_idx
  on public.employee_children (user_id);

-- ---------- employee_assets: equipos/bienes asignados (lista repetible) ----------
create table if not exists public.employee_assets (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.employee_records(user_id) on delete cascade,
  kind    text not null default '',  -- tipo (laptop, celular, vehículo, etc.)
  brand   text not null default '',  -- marca
  model   text not null default '',  -- modelo
  serial  text not null default '',  -- número de serie / código patrimonial
  state   text not null default ''   -- bueno / regular / dañado / extraviado / pendiente
);
create index if not exists employee_assets_user_idx
  on public.employee_assets (user_id);

-- ---------- Buzón de reclamos ----------
-- Borrador: atado al usuario para poder retomarlo/editarlo (solo el dueño lo ve).
create table if not exists public.complaint_drafts (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  category   text not null default '',
  body       text not null default '',
  updated_at timestamptz not null default now()
);

-- Reclamo finalizado: ANÓNIMO. No guarda user_id ni hora exacta (solo fecha),
-- para evitar correlacionar con quién lo envió. Lo leen gerencia/super_admin.
create table if not exists public.complaints (
  id           uuid primary key default gen_random_uuid(),
  category     text not null default '',
  body         text not null default '',
  submitted_on date not null default current_date
);

-- Solo registra QUE un usuario ya envió (tope de 1 por persona). Sin contenido.
create table if not exists public.complaint_submissions (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.employee_records      enable row level security;
alter table public.employee_children     enable row level security;
alter table public.employee_assets       enable row level security;
alter table public.complaint_drafts      enable row level security;
alter table public.complaints            enable row level security;
alter table public.complaint_submissions enable row level security;

-- ---------- employee_records ----------
-- El dueño ve lo suyo; gerencia/super_admin ven todo.
drop policy if exists employee_records_select on public.employee_records;
create policy employee_records_select on public.employee_records
  for select using (user_id = auth.uid() or public.is_gerencia());

-- El dueño crea su ficha (arranca en borrador).
drop policy if exists employee_records_insert on public.employee_records;
create policy employee_records_insert on public.employee_records
  for insert with check (
    user_id = auth.uid() and public.is_approved() and status = 'borrador'
  );

-- El dueño edita SOLO mientras está en borrador y no puede autofinalizarse por
-- update directo (finalizar/reabrir van por RPC security definer).
drop policy if exists employee_records_update_owner on public.employee_records;
create policy employee_records_update_owner on public.employee_records
  for update
  using (user_id = auth.uid() and status = 'borrador')
  with check (user_id = auth.uid() and status = 'borrador');

-- Gerencia/super_admin pueden editar (p. ej. correcciones administrativas).
drop policy if exists employee_records_update_gerencia on public.employee_records;
create policy employee_records_update_gerencia on public.employee_records
  for update using (public.is_gerencia()) with check (public.is_gerencia());

-- ---------- employee_children / employee_assets ----------
-- El dueño gestiona sus filas mientras la ficha esté en borrador; gerencia lee.
do $$
declare t text;
begin
  foreach t in array array['employee_children', 'employee_assets'] loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format($p$
      create policy %1$s_select on public.%1$s
        for select using (user_id = auth.uid() or public.is_gerencia())
    $p$, t);

    execute format('drop policy if exists %1$s_write on public.%1$s', t);
    execute format($p$
      create policy %1$s_write on public.%1$s
        for all
        using (
          user_id = auth.uid() and exists (
            select 1 from public.employee_records r
            where r.user_id = %1$s.user_id and r.status = 'borrador'
          )
        )
        with check (
          user_id = auth.uid() and exists (
            select 1 from public.employee_records r
            where r.user_id = %1$s.user_id and r.status = 'borrador'
          )
        )
    $p$, t);
  end loop;
end $$;

-- ---------- complaint_drafts (solo el dueño) ----------
drop policy if exists complaint_drafts_all on public.complaint_drafts;
create policy complaint_drafts_all on public.complaint_drafts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- complaints (solo lectura, solo gerencia) ----------
-- El INSERT lo hace exclusivamente el RPC finalizar_reclamo (security definer),
-- por eso no hay policy de insert ni grant de insert a authenticated.
drop policy if exists complaints_select on public.complaints;
create policy complaints_select on public.complaints
  for select using (public.is_gerencia());

-- ---------- complaint_submissions ----------
-- El dueño ve si ya envió; gerencia ve todo. Insert/Delete van por RPC.
drop policy if exists complaint_submissions_select on public.complaint_submissions;
create policy complaint_submissions_select on public.complaint_submissions
  for select using (user_id = auth.uid() or public.is_gerencia());

-- ============================================================
-- RPCs
-- ============================================================

-- ---------- Finalizar relevamiento (bloquea al trabajador) ----------
create or replace function public.finalizar_relevamiento()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from public.employee_records where user_id = auth.uid();
  if not found then raise exception 'no hay ficha para finalizar'; end if;
  if r.status = 'finalizado' then raise exception 'la ficha ya está finalizada'; end if;

  update public.employee_records
     set status = 'finalizado', finalized_at = now(), updated_at = now()
   where user_id = auth.uid();
end;
$$;

-- ---------- Reabrir relevamiento (solo gerencia/super_admin) ----------
create or replace function public.reabrir_relevamiento(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gerencia() then raise exception 'no autorizado'; end if;
  update public.employee_records
     set status = 'borrador', finalized_at = null, updated_at = now()
   where user_id = p_user;
end;
$$;

-- ---------- Finalizar reclamo (anonimiza) ----------
-- Copia el borrador a complaints SIN user_id, marca el envío (tope 1/usuario) y
-- borra el borrador. Corta el vínculo con la identidad.
create or replace function public.finalizar_reclamo()
returns void language plpgsql security definer set search_path = public as $$
declare d record;
begin
  if exists (select 1 from public.complaint_submissions where user_id = auth.uid()) then
    raise exception 'ya enviaste un reclamo';
  end if;

  select * into d from public.complaint_drafts where user_id = auth.uid();
  if not found or coalesce(btrim(d.body), '') = '' then
    raise exception 'el reclamo está vacío';
  end if;

  insert into public.complaints (category, body) values (d.category, d.body);
  insert into public.complaint_submissions (user_id) values (auth.uid());
  delete from public.complaint_drafts where user_id = auth.uid();
end;
$$;

-- ---------- Liberar el candado del reclamo (solo gerencia/super_admin) ----------
-- Permite que un usuario vuelva a escribir un reclamo NUEVO. El texto anónimo
-- anterior queda intacto (no se puede reasociar).
create or replace function public.liberar_reclamo(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gerencia() then raise exception 'no autorizado'; end if;
  delete from public.complaint_submissions where user_id = p_user;
end;
$$;

-- ============================================================
-- GRANTS (RLS sigue aplicando encima). Estas tablas NO se exponen a anon.
-- ============================================================
grant select, insert, update, delete on public.employee_records      to authenticated;
grant select, insert, update, delete on public.employee_children     to authenticated;
grant select, insert, update, delete on public.employee_assets       to authenticated;
grant select, insert, update, delete on public.complaint_drafts      to authenticated;
grant select                          on public.complaints           to authenticated;
grant select                          on public.complaint_submissions to authenticated;

grant execute on function public.finalizar_relevamiento()      to authenticated;
grant execute on function public.reabrir_relevamiento(uuid)    to authenticated;
grant execute on function public.finalizar_reclamo()           to authenticated;
grant execute on function public.liberar_reclamo(uuid)         to authenticated;
