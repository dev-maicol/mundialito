import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function CambiarPasswordPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.must_change_password) redirect("/partidos");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-gradient">Cambiá tu contraseña</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Un administrador restableció tu contraseña. Elegí una nueva para continuar.
          </p>
        </div>
        <div className="card p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
