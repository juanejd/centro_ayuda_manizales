"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

// No "Inicio" entry: the brand mark on the left already links to "/", the
// same pattern used everywhere else instead of repeating a Home link.
const NAV_LINKS = [
  { href: "/necesito-ayuda", label: "Necesito ayuda" },
  { href: "/quiero-ayudar", label: "Quiero ayudar" },
  { href: "/informacion", label: "Información" },
  { href: "/lineas-atencion", label: "Emergencias" },
  { href: "/mi-publicacion", label: "Mi publicación" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // A route change is the one signal that always means "this menu's job is
  // done" — closing on click alone misses back/forward navigation. Resetting
  // during render (not in an effect) avoids the extra commit-then-rerender
  // pass an effect would cause here.
  const [trackedPathname, setTrackedPathname] = useState(pathname);
  if (trackedPathname !== pathname) {
    setTrackedPathname(pathname);
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-12 shrink-0 items-center gap-2.5 font-heading font-bold"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 text-base">
            🤝
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm whitespace-nowrap sm:text-base">
              Centro de Ayuda Manizales
            </span>
            <span className="text-[0.6875rem] font-medium tracking-wide whitespace-nowrap text-primary-foreground/70">
              IA CONEXIONES S.A.S.
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-0.5 lg:flex"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-primary-foreground/10",
                  isActive && "bg-primary-foreground/15",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 lg:block">
          <Link
            href="/necesito-ayuda"
            className="inline-flex min-h-11 items-center rounded-lg bg-emergency px-4 text-sm font-bold whitespace-nowrap text-emergency-foreground shadow-sm transition-[filter] hover:brightness-95"
          >
            Reportar necesidad
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="site-nav-mobile"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex size-12 items-center justify-center rounded-lg hover:bg-primary-foreground/10 lg:hidden"
        >
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {isOpen ? (
        <nav
          id="site-nav-mobile"
          aria-label="Navegación principal"
          className="border-t border-primary-foreground/15 px-4 py-2 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-12 items-center text-sm font-semibold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="py-2">
              <Link
                href="/necesito-ayuda"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emergency px-4 text-sm font-bold text-emergency-foreground"
              >
                Reportar necesidad
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
