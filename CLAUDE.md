@AGENTS.md

# Pronostico DMO — contexto del proyecto

Quiniela de fútbol (originalmente el Mundial 2026). Los usuarios pronostican
marcadores y suman puntos. **Next.js 16 (App Router, TS) + Supabase
(Auth + Postgres + RLS) + Tailwind v4 + framer-motion**. Deploy en **Vercel** +
**Supabase** (capas gratuitas). Idioma: español (es-BO). Zona horaria de
referencia: **Bolivia (UTC−4)**.

Esta es la versión **Pronostico DMO** para **trabajadores DMO**: registro mínimo
(nick + sucursal + correo + contraseña) + módulo de **relevamiento de datos del
personal** + **buzón de reclamos anónimo** + rol `gerencia`. Remoto `origin`:
`dev-maicol/mundialito.git`.

## Convenciones de trabajo
- Antes de cada commit: `npm run lint` y `npm run build` deben pasar.
- Cambios de base de datos: **archivos SQL numerados** en `supabase/migrations/`
  (`00NN_descripcion.sql`). Además, se mantienen actualizados los "fuente"
  `0001_schema.sql`, `0002_rls.sql`, `0003_functions.sql`, `0007...` para que una
  instalación nueva pueda correr todo en orden. Las migraciones se ejecutan
  **a mano** en el SQL Editor de Supabase (no hay CLI conectada).
- Commits terminan con: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- El usuario controla cuándo se hace `commit y push` (remoto HTTPS, credenciales cacheadas).

## Clonar y trabajar localmente
```bash
git clone https://github.com/dev-maicol/mundialito.git
cd mundialito
npm install
cp .env.local.example .env.local   # completar con URL + anon + service_role de Supabase
npm run dev                         # http://localhost:3000
```
- Hace falta un proyecto de Supabase con **todas las migraciones corridas** (0001→0019)
  para que la app funcione (login, datos, etc.). Para una base nueva, ver
  "Puesta en marcha" más abajo.
- Para tocar la base ya existente: ejecutar SQL en el **SQL Editor** de Supabase.
- Antes de commitear: `npm run lint` y `npm run build` deben pasar.

## Auth y roles
- **Login por correo real**: el usuario inicia sesión con su email (es el email de
  Supabase Auth). El **nombre completo** (`full_name`) es el identificador visible
  en toda la app (ranking, pronósticos, ficha). Helpers de correo y la lista de
  departamentos en `src/lib/account.ts`. La habilitación de la cuenta es por
  **aprobación de un admin**.
- **Registro server-side** (`src/app/(auth)/register/actions.ts` → `registerUser`):
  el alta NO usa `supabase.auth.signUp` (que dispararía un mail de confirmación y
  choca con el límite del SMTP built-in). Usa la **service_role**
  (`admin.auth.admin.createUser({ email_confirm: true, ... })`): crea el usuario ya
  **confirmado y SIN enviar mail** → independiente de SMTP y del toggle "Confirm
  email". El perfil queda 'pendiente' (trigger) hasta que el admin lo aprueba. La
  validación (correo, password, sucursal) ocurre en el servidor.
- Red de seguridad: `setUserStatus` → 'aprobado' también hace `email_confirm: true`
  (idempotente), por si algún usuario fue creado por otra vía sin confirmar.
- **Registro mínimo (fork "trabajadores DMO")**: el alta pide solo **nick**
  (`full_name`, el nombre visible en ranking/pronósticos — es un apodo, no el nombre
  completo), **sucursal** (`branch`, dropdown de 7: Central/Oruro/La Paz/Cochabamba/
  Santa Cruz/Sucre/Potosí, con CHECK `profiles_branch_chk`; lista en
  `src/lib/account.ts` → `BRANCHES`, debe coincidir con el CHECK), **correo**,
  **contraseña** y **emoji** opcional. TODO el resto de los datos personales se
  recolecta después de entrar, en el **relevamiento** (ver "Módulos del fork"). La
  ficha del panel de Usuarios muestra solo nick/correo/sucursal.
- Roles: `super_admin` > `admin` > `apostador`, más **`gerencia`** (capacidad
  **paralela**, no jerárquica). Registro **por aprobación** (`status` pendiente →
  aprobado/rechazado).
  - apostador: apuesta y ve puntos/ranking.
  - admin: además abre/cierra apuestas, carga resultados y **aprueba/rechaza** usuarios.
  - super_admin: además ABM de equipos, alta de partidos, **asigna roles** y **resetea contraseñas**.
  - **gerencia**: juega como apostador y además **LEE** el relevamiento y los reclamos
    en `/rrhh`. NO gestiona la quiniela ni aprueba usuarios. En código se decide con
    `canReadEmployeeData` (`src/lib/auth.ts`) / `requireEmployeeReader`, en SQL con
    `is_gerencia()`. **`hasRole` NO sirve** para este acceso (gerencia comparte rango
    con apostador, a propósito).
- Reseteo de contraseña: el super_admin la pone en `123456` y marca
  `must_change_password`; el usuario debe cambiarla al entrar (`/cambiar-password`).
  Usa la **service_role key** solo en el servidor (`src/lib/supabase/admin.ts`).
- **Sesión persistente**: las cookies de auth se escriben con `maxAge` de 400 días
  (en los 3 clientes Supabase), para que no se borren al cerrar el navegador. El
  `proxy` además **copia las cookies renovadas en los redirects** (si no, se
  perdía el token rotado y cerraba sesión). Cierres intermitentes restantes suelen
  ser carreras de refresh (multi-pestaña); ajustables en Supabase (JWT expiry /
  refresh reuse interval).

## Reglas de puntaje
- Grupos (máx 5): +3 sentido (gana A/empate/gana B), +2 marcador exacto.
- Eliminatoria (máx 5): +3 acertar quién avanza (lo **elige el apostador**, con
  botones, independiente del marcador a 90'), +2 marcador exacto a 90'. (Se quitó
  el bonus de prórroga/penales; el apostador ya no predice la vía.)
- Apuesta **única e inmutable** por partido. Cierre al kickoff por RLS.
  Apertura/cierre automático por hora vía `pg_cron` (ventana en
  `app_settings.bet_open_hours_before`, default 5h; **editable desde
  `/admin/configuracion`** por el super_admin). Valor grande (ej. 720h) = abierto
  casi desde que se crea el partido.

## Funcionalidades clave y dónde viven
- `src/lib/supabase/{client,server,middleware,admin}.ts` — clientes Supabase.
- `src/proxy.ts` — refresco de sesión / protección de rutas (Next 16 usa `proxy`, no `middleware`).
- `src/lib/auth.ts` — `getProfile`, `requireApproved`, `requireRole`, `hasRole`.
- `src/app/(auth)/` — login, register, pending. `/cambiar-password` (cambio forzado).
- `src/app/(app)/` — layout con NavBar; partidos, mis-pronosticos, ranking, admin/*.
- `src/components/NavBar.tsx` — barra con **hamburguesa siempre visible** y **drawer
  desde la derecha**; el logo dice **"Pronostico"** en color sólido `brand-text` (gris
  suave en oscuro, no blanco puro; sin degradado).
- `src/components/PartidosList.tsx` — pestañas Próximos / Finalizados.
- `src/components/MatchCard.tsx` + `BetForm.tsx` + `VersusBanner.tsx` — apuesta y confirmación (con "versus").
- `src/components/PredictionsButton.tsx` — modal de pronósticos (al cerrar), numerado, por orden de apuesta, resalta el propio.
- `src/components/Tooltip.tsx` — tooltip propio (hover en desktop, tap con auto-ocultado en móvil). `MatchCard` muestra un badge "Apuestas hasta el momento" (mientras está abierto y ya apostaste) con datos de la vista `match_bet_counts`.
- `src/components/AppAlerts.tsx` — **confeti** de puntos ganados (vía `claim_unseen_points`, atómico).
- `src/components/TeamFlag.tsx` — banderas (flagcdn, lazy + borde).
- `src/app/(app)/admin/configuracion/` + `BetOpenHoursForm.tsx` — pantalla **Config** (super_admin) para editar la ventana de apertura (con modal de confirmación).
- `src/components/admin/AdminMatchList.tsx` — gestión de partidos con pestañas Próximos/Finalizados.
- `src/components/admin/UsuariosList.tsx` — usuarios con pestañas Pendientes/Aprobados/Rechazados; admin común puede aprobar/rechazar, super_admin asigna roles/resetea.
- Tema **azul** claro/oscuro por tokens CSS en `src/app/globals.css` (`--c-brand`,
  `--c-brandsoft`, `--c-glow`; botón `blue-600/700`) + `ThemeToggle.tsx` (default
  oscuro). El acento es azul; el rojo se reserva para errores/eliminar. Clase
  `brand-text` para el título del logo (gris suave en oscuro).
- `src/components/AutoRefresh.tsx` — **polling** con `router.refresh()` (re-render del
  server component con datos frescos, sin recargar la página ni perder estado).
  Aplicado en `/pending` (5s, auto-ingreso al aprobar), `/ranking` (10s),
  `/admin/usuarios` (8s) y `/rrhh` (12s). Las páginas usan `cookies()`/`force-dynamic`.
- **Responsive móvil**: mis-pronosticos usa tarjetas en celular (tabla en desktop); ranking trunca el nombre con "…".
- Nombres de equipos en español (traducidos del listado oficial; p. ej. "República Checa", "Qatar"). Son solo datos (`teams.name`); se corrigen con `UPDATE` o re-corriendo `seed_teams.sql` (upsert por código).

## Migraciones (resumen)
Correr **todas en orden** en una instancia nueva. `0005` requiere la extensión `pg_cron`.
- 0001 esquema (enums, tablas, vista `standings`). 0002 RLS + helpers. 0003 funciones (trigger perfil, `award_points`, `set_match_result`, `claim_unseen_points`).
- 0004 cierre auto (reemplazada por 0005). 0005 apertura/cierre auto (pg_cron + `app_settings`).
- 0006 ranking sin super_admin. 0007 `match_predictions`. 0008 `must_change_password`.
- 0009 auditoría de resultado. 0010 `points_seen` (memoria del confeti). 0011 solo super_admin corrige finalizados. 0012 `match_predictions` ordenado por fecha + `user_id`. 0013 `claim_unseen_points` (atómico) + clean slate. 0014 vista `match_bet_counts` (cantidad de apuestas por partido). 0015 campos `sub_specialty` (opcional), `is_resident` (sí/no) y `residency_year` (si es residente) + trigger `handle_new_user` actualizado. 0016 puntaje eliminatoria simplificado (`award_points`: +3 quién avanza, +2 marcador exacto a 90'; sin bonus). 0017 `register_code` en `app_settings` (código de registro, editable en Configuración; vacío = abierto).
- 0018 **relevamiento de datos del personal** + buzón de reclamos: rol `gerencia`
  (lee datos de RRHH, no gestiona la quiniela), tablas `employee_records`
  (+ `employee_children`, `employee_assets`), buzón anónimo (`complaint_drafts`
  borrador atado al usuario → RPC `finalizar_reclamo` que copia a `complaints`
  **sin user_id** y marca `complaint_submissions` para el tope de 1/usuario) y RPCs
  `finalizar_relevamiento` / `reabrir_relevamiento` / `liberar_reclamo`. ⚠️ El
  `alter type ... add value 'gerencia'` no puede usarse en la misma transacción:
  si el SQL Editor falla, correr esa línea sola primero. En instalación nueva el
  enum ya trae `gerencia` desde 0001.
- 0019 **registro mínimo** (fork "trabajadores DMO"): el alta pide solo nick
  (`full_name`) + `branch` (sucursal: Central/Oruro/La Paz/Cochabamba/Santa
  Cruz/Sucre/Potosí, con CHECK) + correo + contraseña + emoji. Se **quitan** de
  `profiles` los campos salud (`work_city`, `hospital`, `specialty`,
  `sub_specialty`, `is_resident`, `residency_year`, `reference_phone`, `phone`,
  `birth_date`); `birth_date` y `phone` pasan a `employee_records` (sección 1 del
  relevamiento). Trigger `handle_new_user` copia solo email/full_name/branch/emoji.
- Última migración: **0019**. Seeds: `seed_teams.sql` (48 equipos), `seed_matches.sql` (72 partidos), `seed_matches_r32.sql` (16avos). `reset_test_data.sql` para limpiar pruebas.

## Puesta en marcha de una instancia nueva
Ver `README.md`. Resumen: crear Supabase → correr migraciones en orden + seeds →
desactivar "Confirm email" → cargar envs (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) → crear primer
super_admin por SQL → deploy en Vercel (mismas envs).

## Estado actual del fork "trabajadores DMO"
Fork ya **en producción** (reemplazó la idea previa de "personal de salud").
- **Repo**: `dev-maicol/mundialito`. **Deploy**: https://mundialito-dmo.vercel.app
  (Vercel). **Supabase**: proyecto `odhqxibnwzmwyljswdwf` (base nueva, migraciones
  0001→0019 corridas, sin seeds del Mundial). Solo existe el super_admin inicial.
- `SITE_URL` / metadata en `src/app/layout.tsx` apuntan al dominio Vercel; la imagen
  de compartir (OG) se genera por código en `src/app/opengraph-image.tsx`. **Si se
  pone dominio propio, actualizar `SITE_URL` y redeployar** (si no, el preview de
  WhatsApp/redes apunta al dominio viejo). El preview lo cachean las redes: forzar
  re-scrape en el Facebook Sharing Debugger.
- Branding: la marca es **"Pronostico"** (sin "DMO" en el texto; el logo `dmo.png` se
  mantiene). Tema **azul**. El emoji ⚽ se conserva.
- **Migraciones/seed se corrieron por Node + `pg`** usando `DATABASE_URL` (Session
  Pooler de Supabase, 5432) — es la única parte con pooling y es solo ops. La app
  **no** abre conexiones directas a Postgres (todo por HTTP a PostgREST/GoTrue), así
  que no hay connection pooling en runtime.

## Módulos del fork (relevamiento / buzón / RRHH)
- **Relevamiento** (`/relevamiento`): ficha de datos del personal. Wizard de 7
  secciones con **borrador** (editable) → **finalizado** (bloquea al trabajador;
  Gerencia reabre con `reabrir_relevamiento`). El cuestionario está en
  **`src/lib/relevamiento.ts`** (`SECTIONS`) = ÚNICA fuente de verdad (lo consumen el
  wizard, el guardado y la ficha de RRHH). Campos `store:'survey'` (secciones 3-7) →
  JSONB `employee_records.survey_answers` (**agregar/quitar NO necesita migración**);
  `store:'column'` (secciones 1-2) → columna en `employee_records` (necesita migración
  + campo en el tipo `EmployeeRecord`). Listas repetibles `children`/`assets`. Lógica
  en `relevamiento/actions.ts`; UI `components/relevamiento/RelevamientoWizard.tsx`.
- **Buzón** (`/buzon`): reclamos **anónimos**. Borrador atado al usuario
  (`complaint_drafts`, solo el dueño lo ve). Al enviar, el RPC `finalizar_reclamo`
  copia el texto a `complaints` **sin `user_id`** (solo fecha) y marca
  `complaint_submissions` (tope **1/usuario**). La identidad se corta: un reclamo
  finalizado NO se reabre; Gerencia solo puede `liberar_reclamo` para permitir uno
  nuevo. UI `components/buzon/BuzonForm.tsx`.
- **RRHH** (`/rrhh`): panel de lectura para `gerencia`/`super_admin` (guard
  `requireEmployeeReader`). Pestañas Fichas (con reabrir), Reclamos (anónimos) y
  Envíos del buzón (con liberar). `components/rrhh/RrhhPanel.tsx` + `rrhh/actions.ts`.
- **Aviso de cambios sin guardar**: hook `src/lib/useUnsavedChangesWarning.ts`
  (beforeunload + intercepta clics en links del menú) usado en relevamiento y buzón.
- DB: migración **0018** (tablas + rol `gerencia` + RLS + RPCs) y **0019** (registro
  mínimo + `branch` + mover `birth_date`/`phone` a `employee_records`). RLS estricta:
  el dueño edita solo en borrador; datos sensibles solo `gerencia`/`super_admin`;
  nada expuesto a `anon`.

## Pendientes / deuda técnica
- **Seguridad (RLS), sin resolver** (de una revisión previa):
  - `profiles_update_admin` (`0002_rls.sql`) no está limitada por columna → un `admin`
    puede cambiar rol/estado de cualquier no-super_admin pegándole directo a PostgREST.
    Fix: limitar la policy a la columna `status`.
  - Vista `standings` es `security_definer` y `anon` tiene `grant select` → expone
    nombres+puntos sin login. Fix: `security_invoker=on` + revocar select a `anon`.
- **Rotar las API keys de Supabase**: la `service_role` se pegó en el chat durante el
  setup. Conviene regenerarla (Settings → API) y actualizar `.env.local` + Vercel.

## Forkear de nuevo (otras instancias)
Guía completa en **`docs/FORK.md`**: setup repo/Supabase/Vercel, branding, y la
**cadena exacta** para cambiar campos: del **registro** (§6.1: columna en `profiles`
→ trigger `handle_new_user` → `Profile` → `RegisterForm.tsx` → `register/actions.ts`
→ ficha en `UsuariosList.tsx`) y del **relevamiento** (§6.2: casi todo se toca solo en
`src/lib/relevamiento.ts`). El resto del sistema se reutiliza sin cambios.
