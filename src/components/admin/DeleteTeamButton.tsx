"use client";

import { useTransition, useState } from "react";
import { deleteTeam } from "@/app/(app)/admin/actions";

export default function DeleteTeamButton({ teamId }: { teamId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteTeam(teamId);
      if (!res.ok) {
        setError("No se pudo eliminar (¿tiene partidos asociados?).");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDelete}
        disabled={pending}
        className="text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        Eliminar
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
