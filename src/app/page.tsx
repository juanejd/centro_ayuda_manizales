import Link from "next/link";

import { getActiveAlerts } from "@/modules/info-resources/alerts";
import {
  PRIORITY_EMERGENCY_LINES,
  normalizePhoneText,
  toTelHref,
  type PriorityEmergencyLine,
} from "@/modules/info-resources/domain";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { createServerSupabaseClient } from "@/shared/supabase/server";

export const revalidate = 300;

const entryPoints = [
  {
    href: "/necesito-ayuda",
    title: "NECESITO AYUDA",
    description: "Publica una necesidad para que otras personas puedan verla.",
    className:
      "border-emergency bg-emergency text-emergency-foreground hover:brightness-95",
  },
  {
    href: "/quiero-ayudar",
    title: "QUIERO AYUDAR",
    description: "Cuéntanos qué puedes aportar y encuentra dónde hace falta.",
    className:
      "border-primary bg-primary text-primary-foreground hover:brightness-110",
  },
  {
    href: "/informacion",
    title: "BUSCO INFORMACIÓN",
    description: "Consulta albergues, atención médica y recursos oficiales.",
    className: "border-border bg-card text-card-foreground hover:bg-accent",
  },
] as const;


async function getEmergencyLines(): Promise<readonly PriorityEmergencyLine[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("info_resources")
      .select("phones")
      .overlaps(
        "phones",
        PRIORITY_EMERGENCY_LINES.map(({ phone }) => phone),
      )
      .eq("category", "lineas_atencion")
      .eq("is_published", true);

    if (error) {
      throw error;
    }

    const published = new Set(
      ((data ?? []) as Array<{ phones: string[] | null }>).flatMap(
        ({ phones }) => (phones ?? []).map(normalizePhoneText),
      ),
    );

    const stillPublished = PRIORITY_EMERGENCY_LINES.filter(({ phone }) =>
      published.has(normalizePhoneText(phone)),
    );

    if (stillPublished.length > 0) {
      return stillPublished;
    }
  } catch (error) {
    console.error("Unable to load emergency lines from the directory.", error);
  }

  return PRIORITY_EMERGENCY_LINES;
}

export default async function HomePage() {
  const emergencyLines = await getEmergencyLines();
  const activeAlerts = getActiveAlerts(new Date());

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">¿Qué necesitas hacer?</h1>
        </header>

        {activeAlerts.length > 0 && (
          <section aria-label="Alertas vigentes" className="flex flex-col gap-3">
            {activeAlerts.map((alert) => {
              const isLinkSource = alert.source.startsWith("http");

              return (
                <Alert key={alert.title} variant="default">
                  <p className="label-caps text-muted-foreground">
                    Alerta vigente
                  </p>
                  <AlertTitle className="text-base font-bold">
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                  <p className="mt-1 text-xs">
                    {isLinkSource ? (
                      <a
                        href={alert.source}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-12 items-center underline underline-offset-2"
                      >
                        Fuente
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        Fuente: {alert.source}
                      </span>
                    )}
                  </p>
                </Alert>
              );
            })}
          </section>
        )}

        <nav aria-label="Acciones principales">
          <ul className="grid gap-3">
            {entryPoints.map((entryPoint) => (
              <li key={entryPoint.href}>
                <Link
                  href={entryPoint.href}
                  className={`flex min-h-24 flex-col justify-center rounded-xl border px-5 py-3 shadow-sm transition-[filter,background-color] ${entryPoint.className}`}
                >
                  <span className="text-base font-bold tracking-wide">
                    {entryPoint.title}
                  </span>
                  <span className="mt-1 text-sm leading-snug">
                    {entryPoint.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

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
                  {/* The dialled number is the base number; the menu option is
                      text the caller follows once the line answers. */}
                  {label} {phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Esta plataforma no reemplaza las líneas oficiales de emergencia.{" "}
            <Link
              href="/lineas-atencion"
              className="underline underline-offset-2"
            >
              Ver todas las líneas
            </Link>
            .
          </p>
        </section>

        <nav aria-label="Acciones secundarias">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
            <li>
              <Link
                href="/necesidades"
                className="inline-flex min-h-12 items-center underline underline-offset-4"
              >
                Ver todas las necesidades
              </Link>
            </li>
            <li>
              <Link
                href="/mi-publicacion"
                className="inline-flex min-h-12 items-center underline underline-offset-4"
              >
                Gestionar mi publicación
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
