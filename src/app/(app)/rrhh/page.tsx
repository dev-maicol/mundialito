import { requireEmployeeReader } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import RrhhPanel, { type EmployeeFull, type SubmissionRow } from "@/components/rrhh/RrhhPanel";
import type { Complaint, EmployeeAsset, EmployeeChild, EmployeeRecord } from "@/lib/types";
import AutoRefresh from "@/components/AutoRefresh";

export const metadata = { title: "RRHH — Datos del personal" };
export const dynamic = "force-dynamic";

export default async function RrhhPage() {
  await requireEmployeeReader();
  const supabase = await createClient();

  const [
    { data: records },
    { data: profiles },
    { data: children },
    { data: assets },
    { data: complaints },
    { data: submissions },
  ] = await Promise.all([
    supabase.from("employee_records").select("*"),
    supabase.from("profiles").select("id, full_name, email, emoji, branch"),
    supabase.from("employee_children").select("*"),
    supabase.from("employee_assets").select("*"),
    supabase.from("complaints").select("*").order("submitted_on", { ascending: false }),
    supabase.from("complaint_submissions").select("*").order("submitted_at", { ascending: false }),
  ]);

  type ProfileLite = {
    id: string;
    full_name: string;
    email: string;
    emoji: string;
    branch: string | null;
  };
  const profMap = new Map<string, ProfileLite>(
    ((profiles as ProfileLite[] | null) ?? []).map((p) => [p.id, p]),
  );

  const childrenByUser = new Map<string, EmployeeChild[]>();
  for (const c of (children as EmployeeChild[] | null) ?? []) {
    const arr = childrenByUser.get((c as EmployeeChild & { user_id: string }).user_id) ?? [];
    arr.push(c);
    childrenByUser.set((c as EmployeeChild & { user_id: string }).user_id, arr);
  }
  const assetsByUser = new Map<string, EmployeeAsset[]>();
  for (const a of (assets as EmployeeAsset[] | null) ?? []) {
    const arr = assetsByUser.get((a as EmployeeAsset & { user_id: string }).user_id) ?? [];
    arr.push(a);
    assetsByUser.set((a as EmployeeAsset & { user_id: string }).user_id, arr);
  }

  const employees: EmployeeFull[] = ((records as EmployeeRecord[] | null) ?? []).map((r) => {
    const p = profMap.get(r.user_id);
    return {
      record: r,
      children: childrenByUser.get(r.user_id) ?? [],
      assets: assetsByUser.get(r.user_id) ?? [],
      name: p?.full_name || "(sin nombre)",
      email: p?.email ?? "",
      branch: p?.branch ?? null,
      emoji: p?.emoji ?? "⚽",
    };
  });
  employees.sort((a, b) => a.name.localeCompare(b.name, "es"));

  const subs: SubmissionRow[] = (
    (submissions as { user_id: string; submitted_at: string }[] | null) ?? []
  ).map((s) => ({
    user_id: s.user_id,
    submitted_at: s.submitted_at,
    name: profMap.get(s.user_id)?.full_name || "(usuario)",
  }));

  return (
    <div className="flex flex-col gap-5">
      <AutoRefresh intervalMs={12000} />
      <header>
        <h1 className="text-2xl font-bold">Datos del personal (RRHH)</h1>
        <p className="mt-1 text-sm text-muted">
          Fichas de regularización, buzón de reclamos anónimo y envíos. Información
          confidencial: solo Gerencia y super administración.
        </p>
      </header>

      <RrhhPanel
        employees={employees}
        complaints={(complaints as Complaint[] | null) ?? []}
        submissions={subs}
      />
    </div>
  );
}
