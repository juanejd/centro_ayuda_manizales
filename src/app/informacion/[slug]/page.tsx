import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CATEGORY_LABELS,
  UNCONFIRMED_INFO_SENTENCE,
  isDialable,
  toTelHref,
  type FreshnessLevel,
} from "@/modules/info-resources/domain";
import { getResourceBySlug } from "@/modules/info-resources/queries";
import { createServerSupabaseClient } from "@/shared/supabase/server";
import { cn } from "@/shared/lib/utils";

const FRESHNESS_STYLES: Record<
  FreshnessLevel,
  { strip: string; text: string }
> = {
  confirmed: { strip: "border-l-verified", text: "text-verified-foreground" },
  aging: { strip: "border-l-stale", text: "text-stale-foreground" },
  closed: { strip: "border-l-closed", text: "text-closed-foreground" },
  unconfirmed: {
    strip: "border-l-muted-foreground",
    text: "text-muted-foreground",
  },
};

function resolveMapsHref(resource: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}): string | null {
  if (resource.latitude != null && resource.longitude != null) {
    return `https://www.google.com/maps?q=${resource.latitude},${resource.longitude}`;
  }

  if (resource.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resource.address)}`;
  }

  return null;
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  const { freshness } = resource;
  const style = FRESHNESS_STYLES[freshness.level];
  const mapsHref = resolveMapsHref(resource);
  const hasLocationText = Boolean(
    resource.address || resource.neighborhood || resource.comuna,
  );

  const supabase = createServerSupabaseClient();
  const photos = resource.photos.map((photo) => ({
    caption: photo.caption,
    url: supabase.storage
      .from("info-resource-photos")
      .getPublicUrl(photo.storagePath).data.publicUrl,
  }));

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link
          href="/informacion"
          className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Volver al directorio
        </Link>

        <header>
          <p className="label-caps text-muted-foreground">
            {CATEGORY_LABELS[resource.category]}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">{resource.name}</h1>
        </header>

        <div className={cn("rounded-xl border-l-4 bg-card px-4 py-3", style.strip)}>
          <p className={cn("label-caps", style.text)}>
            {freshness.label}
            {resource.comuna ? ` · ${resource.comuna}` : ""}
          </p>
          {freshness.advice ? (
            <p className={cn("mt-1 text-sm font-medium", style.text)}>
              {freshness.advice}
            </p>
          ) : null}
        </div>

        {resource.description ? (
          <p className="text-sm text-foreground/90">{resource.description}</p>
        ) : null}

        <section aria-labelledby="location-title" className="flex flex-col gap-1">
          <h2 id="location-title" className="label-caps text-muted-foreground">
            Ubicación
          </h2>
          {resource.address ? (
            <p className="text-sm">{resource.address}</p>
          ) : null}
          {resource.neighborhood || resource.comuna ? (
            <p className="text-sm text-muted-foreground">
              {[resource.neighborhood, resource.comuna]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {!hasLocationText ? (
            <p className="text-sm text-muted-foreground">
              {UNCONFIRMED_INFO_SENTENCE}
            </p>
          ) : null}
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex min-h-12 w-fit items-center font-semibold text-primary underline decoration-2 underline-offset-4"
            >
              Ver en el mapa
            </a>
          ) : null}
        </section>

        {resource.meeting_point ? (
          <section
            aria-labelledby="meeting-point-title"
            className="flex flex-col gap-1"
          >
            <h2
              id="meeting-point-title"
              className="label-caps text-muted-foreground"
            >
              Punto de encuentro
            </h2>
            <p className="text-sm">{resource.meeting_point}</p>
          </section>
        ) : null}

        {resource.phones.length > 0 ? (
          <section aria-labelledby="phones-title" className="flex flex-col gap-1">
            <h2 id="phones-title" className="label-caps text-muted-foreground">
              Teléfonos
            </h2>
            <ul className="flex flex-col gap-1">
              {resource.phones.map((phone) =>
                isDialable(phone) ? (
                  <li key={phone}>
                    <a
                      href={toTelHref(phone)}
                      className="inline-flex min-h-12 items-center font-semibold text-primary underline decoration-2 underline-offset-4"
                    >
                      {/* The dialled number is the base number; text after it
                          (e.g. "opción 2") is a menu option followed once the
                          line answers, never concatenated into the tel: URL. */}
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
          </section>
        ) : null}

        <section aria-labelledby="hours-title" className="flex flex-col gap-1">
          <h2 id="hours-title" className="label-caps text-muted-foreground">
            Horario
          </h2>
          <p className="text-sm">{resource.hours ?? UNCONFIRMED_INFO_SENTENCE}</p>
        </section>

        <section aria-labelledby="source-title" className="flex flex-col gap-1">
          <h2 id="source-title" className="label-caps text-muted-foreground">
            Fuente y verificación
          </h2>
          <p className="text-sm">
            Fuente: {resource.source ?? UNCONFIRMED_INFO_SENTENCE}
          </p>
          <p className="text-sm">
            {freshness.age
              ? `Última verificación: ${freshness.age}`
              : UNCONFIRMED_INFO_SENTENCE}
          </p>
        </section>

        {photos.length > 0 ? (
          <section aria-labelledby="gallery-title" className="flex flex-col gap-2">
            <h2 id="gallery-title" className="label-caps text-muted-foreground">
              Fotos
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((photo) => (
                <li
                  key={photo.url}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption?.trim() || `Foto de ${resource.name}`}
                    fill
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
