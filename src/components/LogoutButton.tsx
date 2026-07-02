"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Portal from "@/components/Portal";

export default function LogoutButton({
  className,
  full = false,
}: {
  className?: string;
  full?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className={
          className ??
          `inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-red-500 ${
            full ? "w-full" : ""
          }`
        }
      >
        <LogOut size={16} />
        Salir
      </button>

      <Portal>
        <AnimatePresence>
        {confirming && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && setConfirming(false)}
          >
            <motion.div
              className="card w-full max-w-xs p-5 text-center"
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                <LogOut size={22} />
              </div>
              <h3 className="text-lg font-bold">¿Cerrar sesión?</h3>
              <p className="mt-1 text-sm text-muted">
                Vas a salir de tu cuenta.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button onClick={logout} disabled={loading} className="btn-danger flex-1">
                  {loading ? "Saliendo…" : "Salir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
