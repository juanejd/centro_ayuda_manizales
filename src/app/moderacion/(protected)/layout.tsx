import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signOut } from "@/modules/moderation/actions/auth";
import { getCurrentStaffSession } from "@/modules/moderation/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

const NAV_LINKS = [
  { href: "/moderacion", label: "Bandeja" },
  { href: "/moderacion/recursos", label: "Recursos" },
  { href: "/moderacion/alertas", label: "Alertas" },
] as const;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// RF-6.1 — the case that matters is the middle one: authenticated, valid
// session, absent from staff_members. Not the anonymous visitor (the easy
// case, handled by the redirect below) — someone who simply registered a
// Supabase Auth account, which the platform allows by default.
export default async function ModerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentStaffSession();

  if (!session) {
    redirect("/moderacion/login");
  }

  if (!session.role) {
    return (
      <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
          <Alert variant="destructive">
            <AlertTitle>Acceso denegado</AlertTitle>
            <AlertDescription>
              La cuenta {session.email ?? ""} tiene una sesión válida pero no
              pertenece al equipo de moderación. Si crees que esto es un
              error, contacta a quien administra la plataforma.
            </AlertDescription>
          </Alert>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="min-h-12">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <p className="text-sm">
            <span className="label-caps text-muted-foreground">
              Moderación
            </span>{" "}
            · {session.email}
          </p>
          <nav aria-label="Secciones de moderación">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="min-h-10 px-3 text-sm">
            Cerrar sesión
          </Button>
        </form>
      </header>
      <main className="px-4 py-5 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
