import Link from "next/link";
import { Phone } from "lucide-react";

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
    <main className="bg-background text-foreground min-h-screen">
      <div className="border-b-2 border-emergency bg-card">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/"
            className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Volver al inicio
          </Link>
          <div className="flex items-center gap-2">
            <Phone className="size-6 shrink-0 text-emergency" aria-hidden="true" />
            <p className="label-caps text-muted-foreground">
              Centro de Ayuda Manizales
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl">Líneas de atención</h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Guarda estos números. Son las líneas oficiales para emergencias,
            salud, y apoyo durante la crisis.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {UNCONFIRMED_INFO_SENTENCE}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {lines.map((line) => (
              <li
                key={line.slug}
                className="flex h-full flex-col rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
              >
                <p className="label-caps text-muted-foreground">
                  {line.name}
                </p>
                {line.description ? (
                  <p className="mt-1 line-clamp-4 text-sm text-foreground/90">
                    {line.description}
                  </p>
                ) : null}
                <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                  {line.phones.map((phone) =>
                    isDialable(phone) ? (
                      <li key={phone}>
                        <a
                          href={toTelHref(phone)}
                          className="inline-flex min-h-12 items-center text-lg font-bold text-emergency underline decoration-2 underline-offset-4"
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
                <p className="mt-auto pt-1 text-xs text-muted-foreground">
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
