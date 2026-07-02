# Guía para forkear (crear otra instancia)

Esta app está pensada para clonarse por evento/público. El sistema base (auth por
correo + código, aprobación, pronósticos, eliminatoria, ranking, reglas) se
reutiliza tal cual. Lo que cambia por fork es:

1. **El registro** — ahora es **mínimo** (nick + sucursal + correo + contraseña + emoji).
2. **El relevamiento de datos** — el módulo donde se juntan TODOS los datos del
   trabajador después de entrar (ver §6.2). Es el lugar natural para pedir mucha info.

> Fork actual: **"trabajadores DMO"** — registro mínimo + relevamiento de datos
> del personal + buzón de reclamos anónimo + rol `gerencia` para leer eso.

---

## 1. Nuevo repositorio
- Crear un repo nuevo en GitHub.
- Copiar este proyecto y apuntar `origin` al repo nuevo (o `git init` con historial limpio).

## 2. Nuevo proyecto de Supabase (aislado)
1. Crear un **proyecto nuevo** en supabase.com (DB + Auth + keys propias).
2. Habilitar la extensión **`pg_cron`** (Database → Extensions) — la usan 0004/0005.
3. **SQL Editor**: correr las migraciones **en orden `0001 → 0019`**.
   - Atajo: concatenar todo en un archivo y pegarlo de una (ver más abajo).
   - Seeds (`seed_teams.sql`, etc.) **solo si** vas a usar los datos del Mundial;
     si armás tu propia competencia, cargá equipos/partidos desde el panel.
4. **No hace falta** tocar "Confirm email": el registro crea el usuario ya
   confirmado con la `service_role` (no manda mails).
5. Crear el primer **super_admin** por SQL (después de registrarte en la app):
   ```sql
   update public.profiles set role='super_admin', status='aprobado'
   where lower(email)=lower('tu_correo@ejemplo.com');
   ```
6. **Código de registro**: la 0017 deja `register_code = 'DMO2026'`. Cambialo desde
   **/admin/configuracion** (o vacío = registro abierto).
7. **Rol `gerencia`**: asignalo desde **/admin/usuarios** (como super_admin) a quien
   deba leer el relevamiento y el buzón en **/rrhh**.

### Atajo: SQL combinado
```bash
# genera un único .sql con todas las migraciones en orden
for f in supabase/migrations/00{01..19}_*.sql; do
  echo "-- ===== $f ====="; cat "$f"; echo;
done > setup.sql
# pegar setup.sql en el SQL Editor del proyecto nuevo (borrarlo después)
```
> Correrlo con Node/`pg` también sirve: hace falta el connection string de Postgres
> (Settings → Database → Connection string → URI, Session pooler). Las keys anon/
> service_role **no** ejecutan DDL.

## 3. Variables de entorno
- `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` del proyecto nuevo.
- Cargar las mismas 3 en **Vercel**.

## 4. Vercel + dominio
- Importar el repo en Vercel, cargar las envs, agregar la URL a **Supabase →
  Authentication → URL Configuration**.
- Dominio propio (subdominio vía Cloudflare): ver `README.md`.

## 5. Branding (checklist de dónde cambiarlo)
| Qué | Dónde |
|---|---|
| Nombre en la barra + logo | `src/components/NavBar.tsx` (texto "Pronostico DMO") + `public/dmo.png` |
| Título de pestaña / metadata / OG | `src/app/layout.tsx` (consts `SITE_URL`, `SITE_NAME`, `SITE_TITLE`, `SITE_DESC`) |
| Título en login/registro | `src/app/(auth)/layout.tsx` |
| Imagen para compartir (WhatsApp) | `src/app/opengraph-image.tsx` (texto) |
| Docs / nombre del paquete | `README.md`, `CLAUDE.md`, `package.json` (`name`) |

---

## 6. Datos que se piden a la gente

Hay **dos** lugares, a propósito separados:

### 6.1 Registro (mínimo) — `profiles`
El alta pide solo lo indispensable para entrar a jugar: **nick** (`full_name`, el
nombre visible en ranking/pronósticos), **sucursal** (`branch`), **correo**,
**contraseña** y un **emoji** opcional. Mantenelo corto: si querés pedir más datos,
casi siempre van en el **relevamiento** (§6.2), no acá.

Para **agregar / quitar / cambiar** un campo *del registro* hay que tocar esta cadena
(ejemplo: agregar `nickname_extra`):
1. **Columna** en `profiles` → migración numerada nueva
   (`alter table public.profiles add column if not exists ...`).
2. **Trigger** `handle_new_user` (última versión en `0019_...sql`): sumá la columna
   al `insert into public.profiles (...)` y su valor desde `raw_user_meta_data`.
3. **Tipo** `Profile` — `src/lib/types.ts`.
4. **Formulario** — `src/components/RegisterForm.tsx` (`useState` + input + al objeto
   que se pasa a `registerUser`).
5. **Acción** — `src/app/(auth)/register/actions.ts` (`RegisterInput`, validación,
   `user_metadata` del `createUser`).
6. **Ficha admin** — `src/components/admin/UsuariosList.tsx`, componente `Ficha`.

**El dropdown de sucursal** vive en `src/lib/account.ts` (`BRANCHES`) y debe coincidir
con el `CHECK profiles_branch_chk` (migración 0019). Si cambian las opciones,
actualizá **ambos**. `buildWhatsappText` (en `UsuariosList.tsx`) agrupa por `branch`.

### 6.2 Relevamiento de datos — `employee_records` ⭐ (el lugar para pedir mucho)
Módulo post-login en **/relevamiento**: wizard por secciones con **borrador**
(editable, avisa si hay cambios sin guardar) y **finalizado** (bloqueado; Gerencia
puede reabrir). Todo el cuestionario está definido en **`src/lib/relevamiento.ts`**
(`SECTIONS`), que es la **única fuente de verdad**: el wizard, el guardado y la ficha
de RRHH se arman solos desde ahí.

Cada campo tiene `store`:
- **`survey`** (secciones 3-7, texto abierto/encuesta) → se guarda en el JSONB
  `employee_records.survey_answers`. **Agregar/quitar uno NO necesita migración**:
  editás `SECTIONS` y listo.
- **`column`** (secciones 1-2, datos consultables) → mapea a una **columna** de
  `employee_records`. Agregar uno = 3 pasos: (a) migración con la columna, (b) campo
  en `SECTIONS` con `store:'column'`, (c) campo en el tipo `EmployeeRecord`
  (`src/lib/types.ts`). El casteo (fecha / sí-no) sale del `kind`.
- **`special`** → listas repetibles ya resueltas: `children` (hijos) y `assets`
  (equipos/bienes), con tablas `employee_children` / `employee_assets`.

Marcá `required: true` para que sea obligatorio al **finalizar** (la validación usa
`missingRequired`). Usá `dependsOn` para mostrar un campo según otro.

### 6.3 Buzón de reclamos anónimo — `complaints`
**/buzon**: borrador privado (atado al usuario) → al enviar, el RPC `finalizar_reclamo`
copia el texto a `complaints` **sin `user_id`** (anónimo) y marca
`complaint_submissions` para el tope de **1 por persona**. Categorías en
`src/components/buzon/BuzonForm.tsx` (`COMPLAINT_CATEGORIES`).

### 6.4 Roles y lectura
`gerencia` y `super_admin` leen todo lo anterior en **/rrhh** (helper
`canReadEmployeeData` en `src/lib/auth.ts`; en SQL, `is_gerencia()`). El `admin`
común **no** ve datos sensibles: solo aprueba usuarios de la quiniela. La RLS es la
frontera real (ver `0018_*.sql`).

### Notas
- La **puerta del código** (`RegisterFlow.tsx`) y la validación del correo
  (`account.ts`) no dependen de los campos: se reutilizan sin tocar.
- `register/page.tsx` (servidor) detecta si hay código configurado; no hay que
  tocarlo al cambiar campos.

---

## 7. Otros textos a revisar (no son código crítico)
- **Reglas** — `src/app/(app)/reglas/page.tsx`: textos, puntaje y ejemplos.
- **Ranking / pronósticos**: la nota de desempate está en `reglas` y en `ranking/page.tsx`.

## 8. Datos del torneo
- `seed_teams.sql` (48 equipos). Partidos: crear a mano desde **Gestión** o usar
  `seed_matches.sql` / `seed_matches_r32.sql`. El puntaje de eliminatoria es +3 quién
  avanza, +2 marcador exacto a 90' (migración 0016).
