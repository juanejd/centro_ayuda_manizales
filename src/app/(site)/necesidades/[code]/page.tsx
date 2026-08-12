import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Phone, Users } from "lucide-react";

import { CATEGORY_ICONS } from "@/modules/help-requests/components/category-icon";
import {
  CATEGORY_LABELS,
  MODERATION_BADGE,
} from "@/modules/help-requests/domain/validation";
import {
  getPublicHelpRequestByReferenceCode,
  resolveHelpRequestPhotoUrl,
} from "@/modules/help-requests/queries";
import { toTelHref, toWhatsAppHref } from "@/modules/info-resources/domain";
import { ShareButton } from "@/shared/components/share-button";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Only ever fed latitude_approx/longitude_approx from public_help_requests —
// that view rounds coordinates (round(latitude, 3)) before anon can see
// them at all, so this function structurally cannot receive an exact
// coordinate to leak, regardless of what's passed in.
function resolveMapsHref(latitudeApprox: number | null, longitudeApprox: number | null) {
  if (latitudeApprox == null || longitudeApprox == null) {
    return null;
  }
  return `https://www.google.com/maps?q=${latitudeApprox},${longitudeApprox}`;
}

export default async function NeedDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const need = await getPublicHelpRequestByReferenceCode(code);

  if (!need) {
    notFound();
  }

  const mapsHref = resolveMapsHref(need.latitudeApprox, need.longitudeApprox);
  const photoUrl = resolveHelpRequestPhotoUrl(need.photoPath);
  const CategoryIcon = CATEGORY_ICONS[need.category];
  const locationLine = [need.neighborhood ?? need.sector, need.comuna]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/necesidades"
            className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Volver al tablero
          </Link>
          <ShareButton
            path={`/necesidades/${need.referenceCode}`}
            title={`${CATEGORY_LABELS[need.category]} · Centro de Ayuda Manizales`}
            text={`${need.contactName} necesita ayuda con: ${need.description}`}
          />
        </div>

        {/* Photo first, per the same card convention used on the board. */}
        {photoUrl ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
            <Image
              src={photoUrl}
              alt={`Foto de la necesidad ${need.referenceCode}`}
              fill
              priority
              sizes="(min-width: 672px) 672px, 100vw"
              className="object-cover"
            />
            <span className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <CategoryIcon className="size-5" aria-hidden="true" />
            </span>
          </div>
        ) : null}

        <header className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={MODERATION_BADGE[need.moderationStatus].className}>
              {MODERATION_BADGE[need.moderationStatus].label}
            </Badge>
            {need.fulfillmentStatus === "atendida" ? (
              <Badge className="bg-closed-surface text-closed-foreground">
                Atendida
              </Badge>
            ) : null}
          </div>
          <p className="label-caps flex items-center gap-1.5 text-muted-foreground">
            {photoUrl ? null : (
              <CategoryIcon className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {CATEGORY_LABELS[need.category]} · Radicado {need.referenceCode}
          </p>
          <h1 className="text-2xl sm:text-3xl">{need.contactName}</h1>
        </header>

        <Alert variant="destructive">
          <AlertTitle>Verifica antes de responder</AlertTitle>
          <AlertDescription>
            Esta información la publica cada persona directamente, sin
            revisión previa. Confirma la necesidad por teléfono antes de
            desplazarte o entregar dinero o bienes.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
          <section aria-labelledby="description-title" className="flex flex-col gap-1 px-5 py-4">
            <h2 id="description-title" className="label-caps text-muted-foreground">
              Descripción
            </h2>
            <p className="text-sm text-foreground/90">{need.description}</p>
          </section>

          <section aria-labelledby="contact-title" className="flex flex-col gap-2 px-5 py-4">
            <h2 id="contact-title" className="label-caps text-muted-foreground">
              Contacto
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={toTelHref(need.contactPhone)}
                className="inline-flex min-h-12 w-fit items-center gap-2 rounded-lg bg-primary/10 px-4 text-base font-bold text-primary transition-colors hover:bg-primary/15"
              >
                <Phone className="size-4.5 shrink-0" aria-hidden="true" />
                {need.contactPhone}
              </a>
              <a
                href={toWhatsAppHref(
                  need.contactPhone,
                  `Hola ${need.contactName}, vi tu publicación en el Centro de Ayuda Manizales (radicado ${need.referenceCode}) sobre "${CATEGORY_LABELS[need.category]}" y quiero ayudarte.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 w-fit items-center gap-2 rounded-lg bg-[#25D366]/15 px-4 text-base font-bold text-[#0d6e41] transition-colors hover:bg-[#25D366]/25 dark:text-[#3ddc84]"
              >
                <MessageCircle className="size-4.5 shrink-0" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
            {need.affectedPeople != null ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-4 shrink-0" aria-hidden="true" />
                {need.affectedPeople === 1
                  ? "1 persona afectada"
                  : `${need.affectedPeople} personas afectadas`}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="location-title" className="flex flex-col gap-1.5 px-5 py-4">
            <h2 id="location-title" className="label-caps text-muted-foreground">
              Ubicación
            </h2>
            <p className="flex items-center gap-1.5 text-sm">
              <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {locationLine}
            </p>
            {need.address ? (
              <p className="ml-5.5 text-sm text-muted-foreground">{need.address}</p>
            ) : null}
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex min-h-11 w-fit items-center rounded-lg border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Ver ubicación aproximada en el mapa
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ubicación aproximada no disponible.
              </p>
            )}
          </section>

          {need.moderationStatus === "verificado" && need.verifiedSource ? (
            <section aria-labelledby="verification-title" className="flex flex-col gap-1 px-5 py-4">
              <h2 id="verification-title" className="label-caps text-muted-foreground">
                Verificación
              </h2>
              <p className="text-sm">Fuente: {need.verifiedSource}</p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
