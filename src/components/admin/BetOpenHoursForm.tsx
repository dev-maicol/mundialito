"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { setBetOpenHours, type ActionResult } from "@/app/(app)/admin/actions";
import Portal from "@/components/Portal";

const FORM_ID = "bet-open-hours-form";

export default function BetOpenHoursForm({ current }: { current: number }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    setBetOpenHours,
    null,
  );
  const [hours, setHours] = useState(String(current));
  const [confirming, setConfirming] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function openConfirm() {
    setLocalError(null);
    const n = Number(hours);
    if (!Number.isInteger(n) || n < 1 || n > 720) {
      setLocalError("Ingresá un número de horas entre 1 y 720.");
      return;
    }
    setConfirming(true);
  }

  return (
    <form id={FORM_ID} action={formAction} className="card flex flex-col gap-3 p-4">
      <div>
        <h2 className="font-bold">Apertura automática de pronósticos</h2>
        <p className="mt-1 text-sm text-muted">
          Los pronósticos de cada partido se abren solos esta cantidad de horas antes
          del inicio.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Horas antes del inicio
        <input
          type="number"
          name="hours"
          min={1}
          max={720}
          required
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="input max-w-[10rem]"
        />
      </label>

      {localError && <p className="text-sm text-red-500">{localError}</p>}
      {state && !state.ok && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand">Configuración guardada.</p>}

      <button type="button" onClick={openConfirm} className="btn-primary self-start">
        Guardar
      </button>

      <Portal>
        <AnimatePresence>
          {confirming && (
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !pending && setConfirming(false)}
            >
              <motion.div
                className="card w-full max-w-xs p-5 text-center"
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold">Confirmar cambio</h3>
                <p className="mt-2 text-sm text-muted">
                  Los pronósticos se abrirán{" "}
                  <span className="font-semibold text-brand">{hours} horas</span>{" "}
                  antes del inicio de cada partido.
                </p>
                {state && !state.ok && (
                  <p className="mt-3 text-sm text-red-500">{state.error}</p>
                )}

                {state?.ok ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="btn-primary mt-5 w-full"
                  >
                    Listo
                  </button>
                ) : (
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={pending}
                      className="btn-ghost flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form={FORM_ID}
                      disabled={pending}
                      className="btn-primary flex-1"
                    >
                      {pending ? "Guardando…" : "Confirmar"}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </form>
  );
}
