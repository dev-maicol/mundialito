import { redirect } from "next/navigation";
import { requireApproved, hasRole, canReadEmployeeData } from "@/lib/auth";
import { displayName } from "@/lib/types";
import NavBar, { type NavLink } from "@/components/NavBar";
import AppAlerts from "@/components/AppAlerts";
import Footer from "@/components/Footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireApproved();
  if (profile.must_change_password) redirect("/cambiar-password");
  const isAdmin = hasRole(profile.role, "admin");
  const isSuper = hasRole(profile.role, "super_admin");
  const isReader = canReadEmployeeData(profile.role);

  const links: NavLink[] = [
    { href: "/partidos", label: "Partidos" },
    { href: "/mis-pronosticos", label: "Mis pronósticos" },
    { href: "/ranking", label: "Ranking" },
    { href: "/reglas", label: "Reglas" },
    { href: "/relevamiento", label: "Mis datos" },
    { href: "/buzon", label: "Buzón" },
  ];
  if (isReader) {
    links.push({ href: "/rrhh", label: "RRHH" });
  }
  if (isAdmin) {
    links.push({ href: "/admin/partidos", label: "Gestión" });
    links.push({ href: "/admin/usuarios", label: "Usuarios" });
  }
  if (isSuper) {
    links.push({ href: "/admin/equipos", label: "Equipos" });
    links.push({ href: "/admin/configuracion", label: "Config" });
  }

  const roleLabel =
    profile.role === "super_admin"
      ? "super admin"
      : profile.role === "admin"
        ? "admin"
        : profile.role === "gerencia"
          ? "gerencia"
          : null;

  return (
    <div className="flex min-h-full flex-col">
      <NavBar
        links={links}
        profile={{
          emoji: profile.emoji,
          name: displayName(profile),
          roleLabel,
        }}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
      <Footer />
      <AppAlerts />
    </div>
  );
}
