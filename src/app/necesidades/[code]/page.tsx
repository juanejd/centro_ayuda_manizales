import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CATEGORY_LABELS,
  MODERATION_BADGE,
} from "@/modules/help-requests/domain/validation";
import { getPublicHelpRequestByReferenceCode } from "@/modules/help-requests/queries";
import { toTelHref } from "@/modules/info-resources/domain";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { createServerSupabaseClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const PHOTO_BUCKET = "help-request-photos";

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
  const supabase = createServerSupabaseClient();
  const photoUrl = need.photoPath
    ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(need.photoPath).data
        .publicUrl
    : null;

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Link
          href="/necesidades"
          className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Volver al tablero
        </Link>

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
          <p className="label-caps text-muted-foreground">
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

        <section aria-labelledby="description-title" className="flex flex-col gap-1">
          <h2 id="description-title" className="label-caps text-muted-foreground">
            Descripción
          </h2>
          <p className="text-sm text-foreground/90">{need.description}</p>
        </section>

        <section aria-labelledby="contact-title" className="flex flex-col gap-1">
          <h2 id="contact-title" className="label-caps text-muted-foreground">
            Contacto
          </h2>
          <a
            href={toTelHref(need.contactPhone)}
            className="inline-flex min-h-12 w-fit items-center font-bold text-primary underline decoration-2 underline-offset-4"
          >
            {need.contactPhone}
          </a>
          {need.affectedPeople != null ? (
            <p className="text-sm text-muted-foreground">
              {need.affectedPeople === 1
                ? "1 persona afectada"
                : `${need.affectedPeople} personas afectadas`}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="location-title" className="flex flex-col gap-1">
          <h2 id="location-title" className="label-caps text-muted-foreground">
            Ubicación
          </h2>
          <p className="text-sm">
            {[need.neighborhood ?? need.sector, need.comuna]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {need.address ? (
            <p className="text-sm text-muted-foreground">{need.address}</p>
          ) : null}
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex min-h-12 w-fit items-center font-semibold text-primary underline decoration-2 underline-offset-4"
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
          <section aria-labelledby="verification-title" className="flex flex-col gap-1">
            <h2 id="verification-title" className="label-caps text-muted-foreground">
              Verificación
            </h2>
            <p className="text-sm">Fuente: {need.verifiedSource}</p>
          </section>
        ) : null}

        {photoUrl ? (
          <section aria-labelledby="photo-title" className="flex flex-col gap-2">
            <h2 id="photo-title" className="label-caps text-muted-foreground">
              Foto
            </h2>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
              <Image
                src={photoUrl}
                alt={`Foto de la necesidad ${need.referenceCode}`}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-cover"
              />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
