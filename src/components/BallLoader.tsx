"use client";

import { motion } from "framer-motion";

// Balón de fútbol que rueda de lado a lado mientras gira.
export default function BallLoader({
  label = "Cargando…",
  fullscreen = false,
}: {
  label?: string;
  fullscreen?: boolean;
}) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-10 w-40">
        <motion.div
          className="absolute top-0 text-3xl"
          style={{ left: 0 }}
          animate={{ x: [0, 112, 0], rotate: [0, 360, 0] }}
          transition={{
            x: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          ⚽
        </motion.div>
        {/* sombra que late */}
        <motion.div
          className="absolute bottom-0 left-1 h-1.5 w-7 rounded-full bg-blue-500/30 blur-[2px]"
          animate={{ x: [0, 112, 0], scaleX: [1, 0.7, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {label && (
        <motion.span
          className="text-sm font-medium text-muted"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">{content}</div>
  );
}
