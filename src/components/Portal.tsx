"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Renderiza children en document.body, para que los overlays "fixed" no queden
// atrapados por ancestros con backdrop-filter/transform (que rompen el position:fixed).
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
