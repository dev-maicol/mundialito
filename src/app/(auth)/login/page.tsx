"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeEmail } from "@/lib/account";
import BallLoader from "@/components/BallLoader";
import PasswordInput from "@/components/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) {
      setLoading(false);
      const code = error.code ?? "";
      if (code === "email_not_confirmed") {
        setError(
          "Tu cuenta no está confirmada. Pedile a un administrador que la habilite.",
        );
      } else {
        setError("Correo o contraseña incorrectos.");
      }
      return;
    }
    setEntering(true);
    router.replace("/partidos");
    router.refresh();
  }

  if (entering) return <BallLoader fullscreen label="Entrando…" />;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Iniciar sesión</h2>

      {justRegistered && (
        <p className="rounded-lg border border-blue-500/20 bg-brandsoft px-3 py-2 text-sm text-brand">
          ¡Cuenta creada! Esperá a que un administrador apruebe tu cuenta para
          poder ingresar.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Correo
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
          autoComplete="email"
          placeholder="nombre@dominio.com"
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <PasswordInput
          required
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
      <p className="text-center text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-medium text-brand">
          Registrate
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
