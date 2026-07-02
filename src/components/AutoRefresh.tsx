"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polling: refresca la ruta cada `intervalMs` con router.refresh(), que
// re-renderiza el server component actual con datos frescos SIN recargar toda la
// página ni perder el estado del cliente. Útil para pantallas que dependen de
// cambios que hace otra persona: cuenta pendiente (auto-ingreso al aprobar),
// lista de usuarios, ranking en vivo, panel de RRHH. No renderiza nada.
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
