"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearMustChangePassword } from "@/app/cambiar-password/actions";
import { DEFAULT_RESET_PASSWORD } from "@/lib/constants";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (p1.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (p1 !== p2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (p1 === DEFAULT_RESET_PASSWORD) {
      setError("Elegí una contraseña distinta a la temporal.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Cambia la contraseña con la sesión del propio usuario (mantiene la sesión).
    const { error: upErr } = await supabase.auth.updateUser({ password: p1 });
    if (upErr) {
      setLoading(false);
      setError("No se pudo cambiar la contraseña. Intentá de nuevo.");
      return;
    }

    // Limpia la marca de cambio obligatorio.
    const res = await clearMustChangePassword();
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    setDone(true);
    // Ingreso automático tras un instante para que se vea el mensaje.
    setTimeout(() => {
      router.replace("/partidos");
      router.refresh();
    }, 1600);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="text-emerald-400" size={48} />
        <h2 className="text-lg font-bold">¡Contraseña actualizada!</h2>
        <p className="text-sm text-muted">Te estamos ingresando al sistema…</p>
        <button
          onClick={() => {
            router.replace("/partidos");
            router.refresh();
          }}
          className="btn-primary w-full"
        >
          Ingresar ahora
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nueva contraseña
        <input
          type="password"
          required
          minLength={6}
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          autoComplete="new-password"
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Repetir contraseña
        <input
          type="password"
          required
          minLength={6}
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          autoComplete="new-password"
          className="input"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Guardando…" : "Guardar y continuar"}
      </button>
    </form>
  );
}
