import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import UsuariosList from "@/components/admin/UsuariosList";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const me = await requireRole("admin");
  const canManageRoles = hasRole(me.role, "super_admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  const users = (data as Profile[] | null) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Usuarios</h1>
      <p className="text-sm text-muted">
        {canManageRoles
          ? "Aprobá los registros pendientes, asigná roles y gestioná contraseñas."
          : "Aprobá o rechazá los registros pendientes."}
      </p>
      <UsuariosList
        users={users}
        meId={me.id}
        canManageRoles={canManageRoles}
      />
    </div>
  );
}
