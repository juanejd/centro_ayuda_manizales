import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { toTelHref } from "@/modules/info-resources/domain";
import { getPriorityEmergencyLines } from "@/modules/info-resources/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

// The URL carries the manage token: never let it be indexed, cached, or
// referrer-leaked to a third party via an outbound link on this page.
export const metadata: Metadata = {
  title: "Necesidad publicada | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

type ConfirmationPageProps = {
  searchParams: Promise<{ code?: string; token?: string }>;
};

export default async function PublishConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const { code, token } = await searchParams;

  // This page only ever renders right after a successful publish, which
  // always supplies both. Reaching it without them means a stale/incomplete
  // link — nothing useful to show, so send the person back to publish.
  if (!code || !token) {
    redirect("/necesito-ayuda");
  }

  const manageHref = `/mi-publicacion?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`;
  const emergencyLines = await getPriorityEmergencyLines();

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Necesidad publicada</h1>
        </header>

        <Alert className="border-primary">
          <AlertTitle className="text-base font-bold">
            Tu radicado es {code}
          </AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              Ya es visible en el tablero público. Guarda el siguiente
              enlace: es la <strong>única</strong> forma de marcarla como
              resuelta, corregirla o retirarla, no necesitas cuenta ni
              contraseña.
            </p>
          </AlertDescription>
        </Alert>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">
            Enlace para gestionar tu publicación
          </p>
          <p className="mt-2 break-all">
            <Link
              href={manageHref}
              className="font-semibold underline underline-offset-4"
            >
              {manageHref}
            </Link>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cópialo y guárdalo ahora — captura de pantalla, nota o mensaje a
            ti mismo. Si lo pierdes, existe una ruta manual de retiro, pero es
            más lenta.
          </p>
        </div>

        <section
          aria-labelledby="emergency-lines-title"
          className="border-emergency bg-card text-card-foreground rounded-xl border-2 px-4 py-3"
        >
          <h2 id="emergency-lines-title" className="text-sm">
            ¿Es una emergencia inmediata?
          </h2>
          <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            {emergencyLines.map(({ label, phone }) => (
              <li key={phone}>
                <a
                  href={toTelHref(phone)}
                  className="text-emergency inline-flex min-h-12 items-center font-bold underline decoration-2 underline-offset-4"
                >
                  {label} {phone}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Link
          href="/necesidades"
          className="inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4"
        >
          Ver el tablero de necesidades
        </Link>
      </div>
    </main>
  );
}
