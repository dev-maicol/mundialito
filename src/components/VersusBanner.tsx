"use client";

import { motion } from "framer-motion";

function Side({
  name,
  flag,
  from,
}: {
  name: string;
  flag: string | null;
  from: number;
}) {
  return (
    <motion.div
      className="relative flex flex-1 flex-col items-center justify-end gap-2 overflow-hidden bg-gradient-to-b from-elevated/70 to-surface px-2 pb-3 pt-6"
      initial={{ x: from, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.05 }}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-lg ring-2 ring-slate-500/40">
        {flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flag} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-elevated text-2xl">
            ⚽
          </div>
        )}
      </div>
      <div className="relative text-center text-xs font-bold leading-tight">
        {name}
      </div>
    </motion.div>
  );
}

export default function VersusBanner({
  home,
  away,
}: {
  home: { name: string; flag_url: string | null };
  away: { name: string; flag_url: string | null };
}) {
  return (
    <div className="relative flex items-stretch overflow-hidden rounded-xl border border-line">
      <Side name={home.name} flag={home.flag_url} from={-40} />
      <div className="w-px bg-line" />
      <Side name={away.name} flag={away.flag_url} from={40} />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 13, delay: 0.18 }}
      >
        <span className="vs-glow rounded-full bg-slate-950/85 px-3 py-1 text-lg font-black italic text-blue-400 ring-1 ring-blue-500/50">
          VS
        </span>
      </motion.div>
    </div>
  );
}
