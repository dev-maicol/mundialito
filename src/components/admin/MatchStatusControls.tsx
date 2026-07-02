"use client";

import { useTransition, useState } from "react";
import { setMatchStatus } from "@/app/(app)/admin/actions";
import type { MatchStatus } from "@/lib/types";

const BTN =
  "rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-50";

export default function MatchStatusControls({
  matchId,
  status,
}: {
  matchId: string;
  status: MatchStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: MatchStatus) {
    setError(null);
    startTransition(async () => {
      const res = await setMatchStatus(matchId, next);
      if (!res.ok) setError(res.error);
    });
  }

  if (status === "finalizado") {
    return <span className="text-xs text-muted">Finalizado</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "abierto" && (
        <button
          onClick={() => change("abierto")}
          disabled={pending}
          className={`${BTN} bg-blue-600 text-white hover:bg-blue-700`}
        >
          Abrir pronósticos
        </button>
      )}
      {status === "abierto" && (
        <button
          onClick={() => change("cerrado")}
          disabled={pending}
          className={`${BTN} bg-amber-600 text-white hover:bg-amber-700`}
        >
          Cerrar pronósticos
        </button>
      )}
      {status === "cerrado" && (
        <span className="text-xs text-amber-600">Cerrado</span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
