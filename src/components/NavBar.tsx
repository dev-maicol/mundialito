"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";
import Portal from "@/components/Portal";
import ThemeToggle from "@/components/ThemeToggle";

export type NavLink = { href: string; label: string };

type NavProfile = {
  emoji: string;
  name: string;
  roleLabel: string | null;
};

function Avatar({ emoji }: { emoji: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-lg ring-2 ring-emerald-500/40 shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]">
      {emoji}
    </span>
  );
}

function Brand() {
  const reduce = useReducedMotion();
  return (
    <Link
      href="/partidos"
      className="relative flex items-center gap-2 text-lg font-extrabold tracking-tight"
    >
      <Image
        src="/dmo.png"
        alt="Pronostico DMO"
        width={30}
        height={30}
        priority
        className="shrink-0"
      />
      <span className="text-gradient">Pronostico DMO</span>

      {/* Pelotita que recorre por delante del logo y el texto, rebotando */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute top-1/2 z-20"
          style={{ y: "-50%" }}
          animate={{ left: ["-4%", "100%"] }}
          transition={{
            duration: 2.6,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 3.5, // pausa larga en cada costado
          }}
        >
          <motion.span
            className="block text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
            animate={{
              // rebote tipo gravedad (rápido al bajar, lento al subir)
              y: [0, -14, 0, -12, 0, -10, 0],
              // giro constante mientras avanza
              rotate: [0, 1080],
            }}
            transition={{
              y: {
                duration: 2.6,
                times: [0, 0.18, 0.36, 0.52, 0.68, 0.84, 1],
                ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 3.5,
              },
              rotate: {
                duration: 2.6,
                ease: "linear",
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 3.5,
              },
            }}
          >
            ⚽
          </motion.span>
        </motion.span>
      )}
    </Link>
  );
}

export default function NavBar({
  links,
  profile,
}: {
  links: NavLink[];
  profile: NavProfile;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-overlay backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <Brand />

          {/* Links desktop */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(l.href)
                    ? "bg-brandsoft text-brand"
                    : "text-muted hover:bg-elevated hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Derecha desktop */}
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar emoji={profile.emoji} />
              <span className="flex min-w-0 items-center gap-1 text-sm font-medium text-fg">
                <span className="max-w-[11rem] truncate">{profile.name}</span>
                {profile.roleLabel && (
                  <span className="badge shrink-0 bg-brandsoft text-brand">
                    {profile.roleLabel}
                  </span>
                )}
              </span>
            </div>
            <ThemeToggle />
            <LogoutButton />
          </div>

          {/* Derecha móvil */}
          <div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
            <ThemeToggle />
            <Avatar emoji={profile.emoji} />
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg p-1.5 text-muted transition hover:bg-elevated"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer móvil (desde la izquierda), fuera del header vía portal */}
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <motion.aside
                className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-r border-line bg-surface p-5 shadow-2xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar emoji={profile.emoji} />
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-sm font-semibold">
                        {profile.name}
                      </div>
                      {profile.roleLabel && (
                        <div className="text-xs text-brand">
                          {profile.roleLabel}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar menú"
                    className="rounded-lg p-1.5 text-muted transition hover:bg-elevated"
                  >
                    <X size={22} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1">
                  {links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive(l.href)
                          ? "bg-brandsoft text-brand"
                          : "text-muted hover:bg-elevated"
                      }`}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto border-t border-line pt-4">
                  <LogoutButton className="btn-ghost w-full justify-center" />
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
