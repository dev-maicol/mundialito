"use client";

import { useRef, useState } from "react";

// Tooltip propio: aparece al pasar el mouse (desktop) y al tocar (celular).
// En celular se oculta solo después de unos segundos.
export default function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }
  function show() {
    clearTimer();
    setVisible(true);
  }
  function hide() {
    clearTimer();
    setVisible(false);
  }
  function tapShow() {
    setVisible(true);
    clearTimer();
    timer.current = setTimeout(() => setVisible(false), 2500);
  }

  return (
    <button
      type="button"
      aria-label={label}
      onMouseEnter={show}
      onMouseLeave={hide}
      onBlur={hide}
      onClick={tapShow}
      className="relative inline-flex cursor-default p-0 focus:outline-none"
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-fg shadow-lg shadow-black/30 transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
