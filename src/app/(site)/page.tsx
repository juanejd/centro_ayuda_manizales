import Image from "next/image";
import Link from "next/link";
import {
  Ambulance,
  Droplet,
  Flame,
  Home as HomeIcon,
  MapPinned,
  MessageCircle,
  Phone,
  Scale,
  Stethoscope,
} from "lucide-react";

import { NeedCard } from "@/modules/help-requests/components/need-card";
import {
  listPublicHelpRequests,
  resolveHelpRequestPhotoUrl,
} from "@/modules/help-requests/queries";
import { getActiveAlerts } from "@/modules/info-resources/alerts";
import { toTelHref, toWhatsAppHref } from "@/modules/info-resources/domain";
import { getPriorityEmergencyLines } from "@/modules/info-resources/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

const LEGAL_AID_WHATSAPP = "3117517264";
const LEGAL_AID_MESSAGE =
  "Hola, fui afectado por el sismo en Manizales y quiero asesoría jurídica gratuita.";

export const revalidate = 60;

const HOME_BOARD_PREVIEW_SIZE = 6;

const HELPING_HIGHLIGHTS = [
  { icon: HomeIcon, label: "Albergues" },
  { icon: Droplet, label: "Donación de sangre" },
  { icon: Stethoscope, label: "Atención médica" },
  { icon: Flame, label: "Bomberos y rescate" },
  { icon: Ambulance, label: "Líneas 24/7" },
] as const;

export default async function HomePage() {
  const [emergencyLines, activeAlerts, board] = await Promise.all([
    getPriorityEmergencyLines(),
    getActiveAlerts(),
    listPublicHelpRequests({}),
  ]);

  const previewNeeds = board.items.slice(0, HOME_BOARD_PREVIEW_SIZE);

  return (
    <main className="bg-background text-foreground">
      {/* Hero ------------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/img/hero-manizales-atardecer.png"
            alt="Vista panorámica de Manizales al atardecer"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/85 to-primary/50" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-20">
          <p className="label-caps text-primary-foreground/70">
            IA CONEXIONES S.A.S. · Centro de Ayuda Manizales
          </p>
          <h1 className="max-w-2xl text-4xl text-primary-foreground sm:text-5xl">
            Manizales se ayuda entre todos
          </h1>
          <p className="max-w-xl text-base text-primary-foreground/85 sm:text-lg">
            Un solo lugar para pedir ayuda, ofrecer una mano, y encontrar
            información verificada durante la emergencia. Publica tu
            necesidad y aparece de inmediato en el tablero público.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/necesito-ayuda"
              className="inline-flex min-h-14 items-center rounded-xl bg-emergency px-6 text-base font-bold text-emergency-foreground shadow-lg transition-[filter] hover:brightness-95"
            >
              Necesito ayuda
            </Link>
            <Link
              href="/quiero-ayudar"
              className="inline-flex min-h-14 items-center rounded-xl bg-primary-foreground px-6 text-base font-bold text-primary shadow-lg transition-[filter] hover:brightness-95"
            >
              Quiero ayudar
            </Link>
            <Link
              href="/informacion"
              className="inline-flex min-h-14 items-center rounded-xl border-2 border-primary-foreground/70 px-6 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Busco información
            </Link>
          </div>

          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
            {HELPING_HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/90"
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        {/* Alerts -------------------------------------------------------- */}
        {activeAlerts.length > 0 ? (
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
        ) : null}

        {/* Emergency lines — kept impossible to miss ---------------------- */}
        <section
          aria-labelledby="emergency-lines-title"
          className="flex flex-col gap-3 rounded-2xl border-2 border-emergency bg-card px-5 py-5 shadow-sm sm:px-6"
        >
          <div className="flex items-center gap-2">
            <Phone className="size-5 shrink-0 text-emergency" aria-hidden="true" />
            <h2 id="emergency-lines-title" className="text-base font-bold">
              ¿Es una emergencia inmediata? Llama ya
            </h2>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {emergencyLines.map(({ label, phone }) => (
              <li key={phone}>
                <a
                  href={toTelHref(phone)}
                  className="inline-flex min-h-12 items-center text-lg font-bold text-emergency underline decoration-2 underline-offset-4"
                >
                  {label} {phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Esta plataforma no reemplaza las líneas oficiales de emergencia.{" "}
            <Link href="/lineas-atencion" className="underline underline-offset-2">
              Ver todas las líneas
            </Link>
            .
          </p>
        </section>

        {/* Live board preview ----------------------------------------------- */}
        <section aria-labelledby="board-preview-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPinned className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <h2 id="board-preview-title" className="text-xl font-bold sm:text-2xl">
                Necesidades reportadas ahora
              </h2>
            </div>
            <Link
              href="/necesidades"
              className="inline-flex min-h-12 items-center text-sm font-semibold underline underline-offset-4"
            >
              Ver todas →
            </Link>
          </div>

          {previewNeeds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay publicaciones activas. Cuando alguien reporte una
              necesidad, va a aparecer aquí en menos de un minuto.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {previewNeeds.map((need) => (
                <li key={need.referenceCode}>
                  <NeedCard
                    need={need}
                    photoUrl={resolveHelpRequestPhotoUrl(need.photoPath)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Free legal aid — a value-add offered directly by the company's
            own owner (a lawyer), not part of the platform's core features. */}
        <section
          aria-labelledby="legal-aid-title"
          className="flex flex-col items-start gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-5 py-5 shadow-sm sm:px-6"
        >
          <div className="flex items-center gap-2">
            <Scale className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <h2 id="legal-aid-title" className="text-base font-bold">
              Asesoría jurídica gratuita para afectados por el sismo
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-foreground/90">
            Si tu vivienda, negocio o propiedad resultó afectada, te
            orientamos sin costo en seguros, arrendamientos, propiedad
            horizontal, constructoras y más.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/asesoria-juridica"
              className="inline-flex min-h-12 items-center rounded-lg border border-primary px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              Conocer más
            </Link>
            <a
              href={toWhatsAppHref(LEGAL_AID_WHATSAPP, LEGAL_AID_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white transition-[filter] hover:brightness-95"
            >
              <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
              Escribir por WhatsApp
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
