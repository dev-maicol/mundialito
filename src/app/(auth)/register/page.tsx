import { createAdminClient } from "@/lib/supabase/admin";
import RegisterFlow from "@/components/RegisterFlow";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  // Leemos si hay un código configurado (sin exponer su valor al cliente).
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("register_code")
    .eq("id", 1)
    .single();
  const codeRequired = !!((data?.register_code as string | null) ?? "").trim();

  return <RegisterFlow codeRequired={codeRequired} />;
}
