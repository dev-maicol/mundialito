"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function fireConfetti(confetti: (opts: Record<string, unknown>) => void) {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function AppAlerts() {
  const pathname = usePathname();
  const [gained, setGained] = useState<{ total: number; count: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();

      // Marca y devuelve los puntos no celebrados en una sola operación atómica.
      const { data: claimed, error } = await supabase.rpc("claim_unseen_points");
      if (cancelled || error || !claimed || claimed.length === 0) return;

      const positivas = (claimed as { points_awarded: number }[]).filter(
        (r) => (r.points_awarded ?? 0) > 0,
      );
      const total = positivas.reduce((s, r) => s + (r.points_awarded ?? 0), 0);
      if (total <= 0) return;

      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) return;
      fireConfetti(confetti);
      setGained({ total, count: positivas.length });
      setTimeout(() => setGained(null), 5000);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {gained !== null && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={() => setGained(null)}
            className="card pointer-events-auto relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden px-10 py-7 text-center ring-1 ring-blue-500/30"
            initial={{ scale: 0.6, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <PartyPopper className="text-blue-400" size={44} />
            <div className="text-sm text-muted">¡Ganaste!</div>
            <div className="text-5xl font-extrabold text-brand">+{gained.total}</div>
            <div className="text-sm font-medium">
              {gained.count > 1 ? `puntos en ${gained.count} partidos 🎉` : "puntos 🎉"}
            </div>
            {/* Barra que se reduce indicando el cierre automático */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-blue-400"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
