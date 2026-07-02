import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/lib/types";
import CreateTeamForm from "@/components/admin/CreateTeamForm";
import DeleteTeamButton from "@/components/admin/DeleteTeamButton";

export const dynamic = "force-dynamic";

export default async function AdminEquiposPage() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").order("name");
  const teams = (data as Team[] | null) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Equipos</h1>

      <CreateTeamForm />

      {teams.length === 0 ? (
        <p className="text-muted">Todavía no hay equipos.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-elevated/60 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Equipo</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Grupo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-hover">
                  <td className="px-3 py-2 font-medium">
                    <span className="flex items-center gap-2">
                      {t.flag_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.flag_url}
                          alt={t.name}
                          width={24}
                          height={16}
                          className="h-4 w-6 rounded-sm object-cover ring-1 ring-white/10"
                        />
                      )}
                      {t.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">{t.code}</td>
                  <td className="px-3 py-2 text-muted">{t.group_label ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <DeleteTeamButton teamId={t.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
