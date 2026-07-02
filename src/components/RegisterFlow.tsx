"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { verifyRegisterCode } from "@/app/(auth)/register/actions";
import RegisterForm from "@/components/RegisterForm";

// Guardamos el código validado en sessionStorage para no volver a pedirlo
// mientras el usuario navega entre /login y /register en la misma pestaña.
const SS_KEY = "registerCodeOk";

export default function RegisterFlow({ codeRequired }: { codeRequired: boolean }) {
  const [unlocked, setUnlocked] = useState(!codeRequired);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codeRequired) return; // ya arranca desbloqueado por el estado inicial
    const saved = sessionStorage.getItem(SS_KEY);
    if (saved) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setCode(saved);
      setUnlocked(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [codeRequired]);

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChecking(true);
    const ok = await verifyRegisterCode(code.trim());
    setChecking(false);
    if (!ok) {
      setError("Código de registro inválido.");
      return;
    }
    sessionStorage.setItem(SS_KEY, code.trim());
    setUnlocked(true);
  }

  if (unlocked) return <RegisterForm code={code.trim()} />;

  return (
    <form onSubmit={onCheck} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Código de registro</h2>
      <p className="text-sm text-muted">
        Para el registro ingresa el código que te dio tu representante comercial.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span>Código <span className="text-red-500">*</span></span>
        <input
          type="text"
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Tu código"
          autoCapitalize="none"
          autoComplete="off"
          className="input"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={checking} className="btn-primary w-full">
        {checking ? "Verificando…" : "Continuar"}
      </button>
      <p className="text-center text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-brand">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
