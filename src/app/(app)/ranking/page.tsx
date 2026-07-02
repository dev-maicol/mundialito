import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { shortName, type Standing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const profile = await requireApproved();
  const supabase = await createClient();

  const { data } = await supabase
    .from("standings")
    .select("*")
    .order("total_points", { ascending: false })
    .order("full_name", { ascending: true });

  const standings = (data as Standing[] | null) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight">🏆 Ranking global</h1>

      <div className="card overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-elevated/60 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="w-10 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2">Participante</th>
              <th className="w-16 px-2 py-2 text-center">Aciertos</th>
              <th className="w-16 px-2 py-2 text-center">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {standings.map((s, i) => {
              const isMe = s.user_id === profile.id;
              const medal = ["🥇", "🥈", "🥉"][i];
              const glow = ["glow-gold", "glow-silver", "glow-bronze"][i];
              return (
                <tr
                  key={s.user_id}
                  className={isMe ? "bg-brandsoft" : "hover:bg-hover"}
                >
                  <td className="px-2 py-2 text-center font-bold text-muted">
                    {medal ? (
                      <span className={`inline-block text-2xl ${glow}`}>{medal}</span>
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td className="px-2 py-2 font-medium">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="shrink-0 text-lg">{s.emoji}</span>
                      <span className="truncate">
                        {shortName(s.full_name)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-muted">{s.hits}</td>
                  <td className="px-2 py-2 text-center text-base font-extrabold text-brand">
                    {s.total_points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        En caso de empate en puntos, la organización de <strong>DMO S.R.L.</strong>{" "}
        determinará el/los ganador(es).
      </p>
    </div>
  );
}
