import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import RelevamientoWizard from "@/components/relevamiento/RelevamientoWizard";
import type { EmployeeAsset, EmployeeChild, EmployeeRecord } from "@/lib/types";

export const metadata = { title: "Regularización de datos" };

export default async function RelevamientoPage() {
  await requireApproved();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: record }, { data: children }, { data: assets }] = await Promise.all([
    supabase.from("employee_records").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("employee_children").select("*").eq("user_id", user!.id),
    supabase.from("employee_assets").select("*").eq("user_id", user!.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Regularización de datos del personal</h1>
        <p className="mt-1 text-sm text-muted">
          Completá tus datos con la mayor veracidad posible. Podés guardar como borrador y
          continuar en otro momento; cuando finalices, la ficha queda bloqueada.
        </p>
        <p className="mt-2 rounded-xl border border-line bg-elevated p-3 text-xs text-muted">
          <strong>Confidencialidad:</strong> esta información será tratada con absoluta
          reserva y revisada únicamente por Gerencia o el área autorizada. El objetivo es
          administrativo y de mejora institucional, no sancionatorio.
        </p>
      </header>

      <RelevamientoWizard
        record={(record as EmployeeRecord | null) ?? null}
        childRows={(children as EmployeeChild[] | null) ?? []}
        assets={(assets as EmployeeAsset[] | null) ?? []}
      />
    </div>
  );
}
