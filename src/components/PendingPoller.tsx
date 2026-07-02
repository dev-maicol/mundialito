"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refresca la ruta cada `intervalMs`. La pantalla de "pendiente" es un componente
// servidor que redirige a /partidos cuando el estado pasa a 'aprobado', así que
// al refrescar, apenas el admin aprueba, el usuario entra solo (sin recargar).
export default function PendingPoller({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
