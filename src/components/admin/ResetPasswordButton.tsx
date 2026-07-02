"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { resetUserPassword } from "@/app/(app)/admin/actions";

export default function ResetPasswordButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function doReset() {
    setError(null);
    startTransition(async () => {
      const res = await resetUserPassword(userId);
      setConfirming(false);
      if (res.ok) setResult(res.password);
      else setError(res.error);
    });
  }

  if (result) {
    return (
      <span className="text-xs text-brand">
        Restablecida a <span className="font-mono font-bold">{result}</span>
      </span>
    );
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="text-muted">¿Restablecer?</span>
        <button
          onClick={doReset}
          disabled={pending}
          className="font-medium text-amber-600 hover:underline disabled:opacity-50"
        >
          Sí
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="text-muted hover:underline"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-fg"
        title="Restablecer contraseña"
      >
        <KeyRound size={13} />
        Contraseña
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  );
}
