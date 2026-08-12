import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, Phone } from "lucide-react";

import { RESOURCE_CATEGORY_ICONS } from "@/modules/info-resources/components/category-icon";
import {
  CATEGORY_LABELS,
  UNCONFIRMED_INFO_SENTENCE,
  isDialable,
  toTelHref,
  type FreshnessLevel,
} from "@/modules/info-resources/domain";
import {
  getResourceBySlug,
  resolveResourcePhotoUrl,
} from "@/modules/info-resources/queries";
import { ShareButton } from "@/shared/components/share-button";
import { cn } from "@/shared/lib/utils";

const FRESHNESS_STYLES: Record<
  FreshnessLevel,
  { strip: string; text: string; badge: string }
> = {
  confirmed: {
    strip: "border-l-verified",
    text: "text-verified-foreground",
    badge: "bg-verified-surface text-verified-foreground",
  },
  aging: {
    strip: "border-l-stale",
    text: "text-stale-foreground",
    badge: "bg-stale-surface text-stale-foreground",
  },
  closed: {
    strip: "border-l-closed",
    text: "text-closed-foreground",
    badge: "bg-closed-surface text-closed-foreground",
  },
  unconfirmed: {
    strip: "border-l-muted-foreground",
    text: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground",
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
  const CategoryIcon = RESOURCE_CATEGORY_ICONS[resource.category];

  const photos = resource.photos.map((photo) => ({
    caption: photo.caption,
    url: resolveResourcePhotoUrl(photo.storagePath),
  }));
  const [heroPhoto, ...restPhotos] = photos;

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/informacion"
            className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Volver al directorio
          </Link>
          <ShareButton
            path={`/informacion/${resource.slug}`}
            title={`${resource.name} · Centro de Ayuda Manizales`}
            text={`${resource.name} — ${CATEGORY_LABELS[resource.category]}`}
          />
        </div>

        {/* Photo first, per the same card convention used across the site. */}
        {heroPhoto ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
            <Image
              src={heroPhoto.url!}
              alt={heroPhoto.caption?.trim() || `Foto de ${resource.name}`}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
            <span className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <CategoryIcon className="size-5" aria-hidden="true" />
            </span>
            <span
              className={cn(
                "label-caps absolute top-3 right-3 rounded-full px-3 py-1.5 shadow-sm",
                style.badge,
              )}
            >
              {freshness.label}
            </span>
          </div>
        ) : null}

        {restPhotos.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {restPhotos.map((photo) => (
              <li
                key={photo.url}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={photo.url!}
                  alt={photo.caption?.trim() || `Foto de ${resource.name}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        ) : null}

        <header className="flex flex-col gap-1.5">
          <p className="label-caps flex items-center gap-1.5 text-muted-foreground">
            {heroPhoto ? null : (
              <CategoryIcon className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {CATEGORY_LABELS[resource.category]}
          </p>
          <h1 className="text-2xl sm:text-3xl">{resource.name}</h1>
        </header>

        {!heroPhoto ? (
          <div className={cn("rounded-xl border-l-4 bg-card px-4 py-3 shadow-sm", style.strip)}>
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
        ) : freshness.advice ? (
          <p className={cn("text-sm font-medium", style.text)}>
            {freshness.advice}
          </p>
        ) : null}

        {resource.description ? (
          <p className="text-sm text-foreground/90">{resource.description}</p>
        ) : null}

        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
          <section aria-labelledby="location-title" className="flex flex-col gap-1.5 px-5 py-4">
            <h2 id="location-title" className="label-caps text-muted-foreground">
              Ubicación
            </h2>
            {resource.address ? (
              <p className="flex items-center gap-1.5 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {resource.address}
              </p>
            ) : null}
            {resource.neighborhood || resource.comuna ? (
              <p className="ml-5.5 text-sm text-muted-foreground">
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
                className="mt-1 inline-flex min-h-11 w-fit items-center rounded-lg border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Ver en el mapa
              </a>
            ) : null}
          </section>

          {resource.meeting_point ? (
            <section
              aria-labelledby="meeting-point-title"
              className="flex flex-col gap-1 px-5 py-4"
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
            <section aria-labelledby="phones-title" className="flex flex-col gap-1.5 px-5 py-4">
              <h2 id="phones-title" className="label-caps text-muted-foreground">
                Teléfonos
              </h2>
              <ul className="flex flex-wrap gap-2">
                {resource.phones.map((phone) =>
                  isDialable(phone) ? (
                    <li key={phone}>
                      <a
                        href={toTelHref(phone)}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
                      >
                        <Phone className="size-4 shrink-0" aria-hidden="true" />
                        {/* The dialled number is the base number; text after
                            it (e.g. "opción 2") is a menu option followed
                            once the line answers, never concatenated into
                            the tel: URL. */}
                        {phone}
                      </a>
                    </li>
                  ) : (
                    <li
                      key={phone}
                      className="flex min-h-11 items-center text-sm text-muted-foreground"
                    >
                      {phone}
                    </li>
                  ),
                )}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="hours-title" className="flex flex-col gap-1 px-5 py-4">
            <h2 id="hours-title" className="label-caps flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              Horario
            </h2>
            <p className="text-sm">{resource.hours ?? UNCONFIRMED_INFO_SENTENCE}</p>
          </section>

          <section aria-labelledby="source-title" className="flex flex-col gap-1 px-5 py-4">
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
        </div>
      </div>
    </main>
  );
}
