"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  placeholder?: string;
};

// Input de contraseña con botón "ojito" para mostrar/ocultar el texto.
export default function PasswordInput({
  value,
  onChange,
  required,
  minLength,
  autoComplete,
  autoFocus,
  placeholder,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="input pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={show}
        title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-fg"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
