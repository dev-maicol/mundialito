import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import BuzonForm from "@/components/buzon/BuzonForm";
import type { ComplaintDraft } from "@/lib/types";

export const metadata = { title: "Buzón de reclamos" };

export default async function BuzonPage() {
  await requireApproved();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: draft }, { data: submission }] = await Promise.all([
    supabase.from("complaint_drafts").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("complaint_submissions").select("user_id").eq("user_id", user!.id).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Buzón de reclamos</h1>
        <p className="mt-1 text-sm text-muted">
          Un espacio para hacer llegar reclamos, quejas o sugerencias de forma anónima.
        </p>
      </header>

      <BuzonForm draft={(draft as ComplaintDraft | null) ?? null} alreadySent={!!submission} />
    </div>
  );
}
