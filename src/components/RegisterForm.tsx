"use client";

import { useState } from "react";
import Link from "next/link";
import { normalizeEmail, validateEmail, BRANCHES } from "@/lib/account";
import { DEFAULT_EMOJI } from "@/lib/emojis";
import EmojiPicker from "@/components/EmojiPicker";
import PasswordInput from "@/components/PasswordInput";
import { registerUser } from "@/app/(auth)/register/actions";

// El código ya fue validado en la pantalla previa (RegisterFlow). Lo recibimos
// para reenviarlo al server (que vuelve a validarlo, defensa en profundidad).
export default function RegisterForm({ code }: { code: string }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("");
  const [emoji, setEmoji] = useState<string>(DEFAULT_EMOJI);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const mail = normalizeEmail(email);
    const invalidEmail = validateEmail(mail);
    if (invalidEmail) {
      setError(invalidEmail);
      return;
    }
    if (!fullName.trim()) {
      setError("Ingresá tu nick o apodo.");
      return;
    }
    if (!branch) {
      setError("Elegí tu sucursal.");
      return;
    }

    setLoading(true);
    // En caso de éxito, la server action redirige a /login?registered=1 (el
    // usuario queda confirmado pero PENDIENTE). Sólo retorna acá si hubo error.
    const res = await registerUser({
      code,
      email: mail,
      password,
      full_name: fullName.trim(),
      branch,
      emoji,
    });

    if (!res.ok) {
      setLoading(false);
      setError(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Crear cuenta</h2>

      <label className="flex flex-col gap-1 text-sm">
        <span>Nick o apodo <span className="text-red-500">*</span></span>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ej. El Bicho, Cristiano Ronaldo…"
          autoComplete="nickname"
          className="input"
        />
        <span className="text-xs text-muted">Es el nombre con el que aparecés en el ranking y los pronósticos.</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Sucursal <span className="text-red-500">*</span></span>
        <select
          required
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="input"
        >
          <option value="" disabled>
            Elegí tu sucursal…
          </option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <span>
          Tu emoji: <span className="text-lg">{emoji}</span>
        </span>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span>Correo <span className="text-red-500">*</span></span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ej. nombre@dominio.com"
          autoCapitalize="none"
          autoComplete="email"
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Contraseña <span className="text-red-500">*</span></span>
        <PasswordInput
          required
          minLength={6}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Creando…" : "Registrarme"}
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
