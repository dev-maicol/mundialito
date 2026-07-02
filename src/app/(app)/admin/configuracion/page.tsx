import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import BetOpenHoursForm from "@/components/admin/BetOpenHoursForm";
import RegisterCodeForm from "@/components/admin/RegisterCodeForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  await requireRole("super_admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("bet_open_hours_before, register_code")
    .eq("id", 1)
    .single();
  const current = (data?.bet_open_hours_before as number | undefined) ?? 5;
  const registerCode = (data?.register_code as string | undefined) ?? "";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Configuración</h1>
      <BetOpenHoursForm current={current} />
      <RegisterCodeForm current={registerCode} />
    </div>
  );
}
