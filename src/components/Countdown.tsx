"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Cuenta regresiva hasta el kickoff. Al llegar a 0 refresca la página para que
// el servidor refleje que las apuestas se cerraron (oculta el formulario).
export default function Countdown({ kickoffIso }: { kickoffIso: string }) {
  const router = useRouter();
  const target = new Date(kickoffIso).getTime();
  const [now, setNow] = useState<number | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    // Recién en el cliente fijamos la hora, para evitar un mismatch de
    // hidratación (el servidor no conoce la hora actual del navegador).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (now !== null && target - now <= 0 && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [now, target, router]);

  if (now === null) return null; // evita mismatch de hidratación

  const diff = target - now;
  if (diff <= 0) return <span className="text-red-500">Cerrado</span>;

  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const parts = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
  return <span className="tabular-nums">Cierra en {parts}</span>;
}
