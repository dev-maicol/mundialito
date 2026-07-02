import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatchesWithTeams } from "@/lib/queries";
import type { Team } from "@/lib/types";
import CreateMatchForm from "@/components/admin/CreateMatchForm";
import AdminMatchList from "@/components/admin/AdminMatchList";

export const dynamic = "force-dynamic";

export default async function AdminPartidosPage() {
  const profile = await requireRole("admin");
  const isSuper = hasRole(profile.role, "super_admin");
  const supabase = await createClient();

  const matches = await getMatchesWithTeams();

  let teams: Team[] = [];
  if (isSuper) {
    const { data } = await supabase.from("teams").select("*").order("name");
    teams = (data as Team[] | null) ?? [];
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Gestión de partidos</h1>

      {isSuper &&
        (teams.length >= 2 ? (
          <CreateMatchForm teams={teams} />
        ) : (
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
            Cargá al menos dos equipos en la sección{" "}
            <span className="font-medium">Equipos</span> para poder crear partidos.
          </p>
        ))}

      {matches.length === 0 ? (
        <p className="text-muted">No hay partidos cargados.</p>
      ) : (
        <AdminMatchList matches={matches} isSuper={isSuper} />
      )}
    </div>
  );
}
