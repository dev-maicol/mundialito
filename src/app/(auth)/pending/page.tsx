import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import AutoRefresh from "@/components/AutoRefresh";

export default async function PendingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status === "aprobado") redirect("/partidos");

  const rechazado = profile.status === "rechazado";

  return (
    <div className="flex flex-col gap-4 text-center">
      {!rechazado && <AutoRefresh />}
      <div className="text-4xl">{rechazado ? "🚫" : "⏳"}</div>
      <h2 className="text-lg font-semibold">
        {rechazado ? "Cuenta rechazada" : "Cuenta pendiente de aprobación"}
      </h2>
      <p className="text-sm text-muted">
        {rechazado
          ? "Tu cuenta fue rechazada. Contactá a un administrador si creés que es un error."
          : "Hola " +
            (profile.full_name || "participante") +
            ", tu registro fue recibido. Un administrador debe aprobarte antes de poder pronosticar."}
      </p>
      <LogoutButton className="btn-ghost mx-auto" />
    </div>
  );
}
