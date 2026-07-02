"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { setRegisterCode, type ActionResult } from "@/app/(app)/admin/actions";
import Portal from "@/components/Portal";

const FORM_ID = "register-code-form";

export default function RegisterCodeForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    setRegisterCode,
    null,
  );
  const [code, setCode] = useState(current);
  const [confirming, setConfirming] = useState(false);

  return (
    <form id={FORM_ID} action={formAction} className="card flex flex-col gap-3 p-4">
      <div>
        <h2 className="font-bold">Código de registro</h2>
        <p className="mt-1 text-sm text-muted">
          Las personas necesitan este código para registrarse. Compartilo solo con
          quienes corresponda; si se filtra, cambialo acá. Dejalo <strong>vacío</strong>{" "}
          para permitir el registro sin código.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Código
        <input
          type="text"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="(vacío = registro abierto)"
          autoCapitalize="none"
          autoComplete="off"
          className="input max-w-[16rem]"
        />
      </label>

      {state && !state.ok && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand">Código actualizado.</p>}

      <button type="button" onClick={() => setConfirming(true)} className="btn-primary self-start">
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
                  {code.trim()
                    ? "El nuevo código para registrarse será "
                    : "El registro quedará "}
                  <span className="font-semibold text-brand">
                    {code.trim() ? code.trim() : "abierto (sin código)"}
                  </span>
                  .
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
