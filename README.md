# ⚽ Pronostico DMO

Quiniela deportiva: los usuarios pronostican los marcadores de los partidos y
acumulan puntos según sus aciertos. Construido con **Next.js (App Router) +
Supabase (Auth + Postgres + RLS)**. Pensado para desplegarse gratis en **Vercel +
Supabase**.

## Roles

- **apostador**: ve los partidos, apuesta a los que están abiertos, ve sus puntos y el ranking.
- **admin**: además abre/cierra las apuestas de cada partido y carga el resultado real
  (eso otorga los puntos automáticamente).
- **super_admin**: además registra equipos y partidos, y gestiona/aprueba usuarios y roles.

## Reglas de puntaje

- **Fase de grupos** (máx 5): +3 por acertar el sentido (gana A / empate / gana B); +2 por marcador exacto.
- **Eliminatoria** (máx 5): +3 por acertar quién avanza (lo elige el apostador,
  independiente del marcador a los 90'); +2 por marcador exacto a los 90'.

Otras reglas: una sola apuesta por partido (no editable) y cierre automático a la hora
de inicio del partido (hora de Bolivia, UTC−4), aplicado por la base de datos vía RLS.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutá **todos** los archivos de `supabase/migrations/`
   **en orden numérico** (`0001` → `0017`). La `0005` requiere la extensión
   **pg_cron** (Database → Extensions → pg_cron); la `0004` queda reemplazada por
   la `0005` (correr ambas no causa problema).
3. (Opcional) Cargá los datos del Mundial 2026 (ambos son idempotentes):
   - `supabase/seed_teams.sql` — los 48 equipos con grupos y banderas.
   - `supabase/seed_matches.sql` — los 72 partidos de fase de grupos (correlo
     después del de equipos). Los partidos quedan en estado `programado`; el
     admin los abre cuando quiera habilitar las apuestas.
4. En **Authentication → Providers → Email**, dejá **"Confirm email" desactivado**.
   Los usuarios inician sesión con su **correo real**, pero la habilitación de la
   cuenta es por **aprobación de un administrador** (no por confirmación de mail).
   Si más adelante querés activar la confirmación por correo, configurá primero un
   **SMTP propio** en Supabase (el built-in tiene límites bajos).

### 2. Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá con los datos de
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

> La `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → *service_role*) es
> **secreta** y solo se usa en el servidor (para que el super admin restablezca
> contraseñas). Cargala también en Vercel; nunca la expongas en el cliente.

### 3. Correr en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### 4. Crear el primer super_admin

1. Registrate desde `/register` con tu **correo real** y completá la ficha.
2. En el **SQL Editor** de Supabase, ejecutá (con tu correo):

   ```sql
   update public.profiles
   set role = 'super_admin', status = 'aprobado'
   where lower(email) = lower('tu_correo@ejemplo.com');
   ```

3. Volvé a iniciar sesión: ya tenés acceso a **Equipos**, **Gestión** y **Usuarios**.

## Flujo de uso

1. **super_admin** carga equipos (sección *Equipos*) y crea partidos (*Gestión → Nuevo partido*).
2. **super_admin** aprueba a los usuarios registrados (*Usuarios*) y, si quiere, asigna admins.
3. **admin** abre las apuestas de un partido (*Gestión → Abrir apuestas*).
4. **apostador** pronostica desde *Partidos* (una sola apuesta, hasta la hora de inicio).
5. Tras el partido, **admin** cierra y carga el resultado real → el sistema otorga los puntos.
6. Todos ven sus puntos en *Mis apuestas* y la tabla en *Ranking*.

## Despliegue en Vercel

1. Subí el repo a GitHub e importalo en [vercel.com](https://vercel.com).
2. Cargá las tres variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) en el proyecto de Vercel.
3. En Supabase, agregá la URL de Vercel en **Authentication → URL Configuration**
   (Site URL / Redirect URLs).

### Dominio propio (subdominio vía Cloudflare)

Podés vincular un subdominio (ej. `quiniela.tudominio.com`) sin perder la URL
`*.vercel.app` — **ambas siguen funcionando** (la `.vercel.app` es permanente).

1. **Vercel → Project → Settings → Domains** → agregá `quiniela.tudominio.com`.
   Vercel te indica el registro DNS (para un subdominio es un **CNAME** a
   `cname.vercel-dns.com`; para el apex sería un `A` a la IP de Vercel).
2. **Cloudflare → DNS → Add record**: `CNAME`, Name `quiniela`, Target
   `cname.vercel-dns.com`, **Proxy status: DNS only (nube gris)**.
3. Esperá la propagación; Vercel emite el certificado SSL solo.
4. **Importante**: dejá la nube **gris** al menos hasta que Vercel verifique y
   emita el cert. Si después la pasás a **naranja (Proxied)** para usar el CDN de
   Cloudflare, configurá **SSL/TLS → Full (strict)** o habrá bucle de redirección.
5. **No olvidar**: sumá el nuevo dominio en **Supabase → Authentication → URL
   Configuration** (Site URL / Redirect URLs), igual que con la URL de Vercel.

## Estructura

- `supabase/migrations/` — esquema, RLS y funciones (`award_points`, `set_match_result`).
- `src/lib/supabase/` — clientes de Supabase (browser/server) y refresco de sesión.
- `src/lib/auth.ts` — helpers de sesión y guards por rol.
- `src/app/(auth)/` — login, registro y pantalla de cuenta pendiente.
- `src/app/(app)/` — partidos, mis-pronosticos, ranking y paneles de admin/super_admin.
