import Link from "next/link";

import {
  UNCONFIRMED_INFO_SENTENCE,
  isDialable,
  toTelHref,
} from "@/modules/info-resources/domain";
import { listResources } from "@/modules/info-resources/queries";

export const revalidate = 300;

export default async function EmergencyLinesPage() {
  const lines = await listResources({ category: "lineas_atencion" });

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Link
          href="/"
          className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Volver al inicio
        </Link>

        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Líneas de atención</h1>
        </header>

        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {UNCONFIRMED_INFO_SENTENCE}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {lines.map((line) => (
              <li
                key={line.slug}
                className="rounded-xl border border-border bg-card px-4 py-3"
              >
                <p className="label-caps text-muted-foreground">
                  {line.name}
                </p>
                {line.description ? (
                  <p className="mt-1 text-sm text-foreground/90">
                    {line.description}
                  </p>
                ) : null}
                <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                  {line.phones.map((phone) =>
                    isDialable(phone) ? (
                      <li key={phone}>
                        <a
                          href={toTelHref(phone)}
                          className="inline-flex min-h-12 items-center font-bold text-primary underline decoration-2 underline-offset-4"
                        >
                          {phone}
                        </a>
                      </li>
                    ) : (
                      <li
                        key={phone}
                        className="flex min-h-12 items-center text-sm text-muted-foreground"
                      >
                        {phone}
                      </li>
                    ),
                  )}
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fuente: {line.source ?? UNCONFIRMED_INFO_SENTENCE}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
