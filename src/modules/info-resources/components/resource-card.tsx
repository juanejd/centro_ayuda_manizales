import Image from "next/image";
import Link from "next/link";

import { RESOURCE_CATEGORY_ICONS } from "@/modules/info-resources/components/category-icon";
import {
  CATEGORY_LABELS,
  UNCONFIRMED_INFO_SENTENCE,
  type FreshnessLevel,
} from "@/modules/info-resources/domain";
import type { DirectoryResource } from "@/modules/info-resources/queries";
import { ShareButton } from "@/shared/components/share-button";
import { Card, CardContent, CardTitle } from "@/shared/ui/card";
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

export function ResourceCard({
  resource,
  photoUrl,
}: {
  resource: DirectoryResource;
  photoUrl?: string | null;
}) {
  const { freshness } = resource;
  const style = FRESHNESS_STYLES[freshness.level];
  const locationLine = resource.address ?? resource.neighborhood;
  const CategoryIcon = RESOURCE_CATEGORY_ICONS[resource.category];

  return (
    <Card
      className={cn(
        "h-full gap-2 border-l-4 transition-shadow duration-200 hover:shadow-md",
        style.strip,
        photoUrl && "pt-0",
      )}
    >
      {photoUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={photoUrl}
            alt={`Foto de ${resource.name}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute top-2.5 left-2.5 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <CategoryIcon className="size-4.5" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "label-caps absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 shadow-sm",
              style.badge,
            )}
          >
            {freshness.label}
          </span>
        </div>
      ) : null}
      <CardContent className="flex flex-1 flex-col gap-1.5">
        <p className={cn("label-caps flex items-center gap-1.5", style.text)}>
          {photoUrl ? null : (
            <CategoryIcon className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          {photoUrl ? null : `${freshness.label} · `}
          {CATEGORY_LABELS[resource.category]}
          {resource.comuna ? ` · ${resource.comuna}` : ""}
        </p>

        <CardTitle className="text-lg">{resource.name}</CardTitle>

        {locationLine ? (
          <p className="text-sm text-muted-foreground">{locationLine}</p>
        ) : null}

        {resource.description ? (
          <p className="line-clamp-2 text-sm text-foreground/90">
            {resource.description}
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Fuente: {resource.source ?? UNCONFIRMED_INFO_SENTENCE}
        </p>

        <p className="text-xs text-muted-foreground">
          {freshness.age
            ? `Última verificación: ${freshness.age}`
            : UNCONFIRMED_INFO_SENTENCE}
        </p>

        {freshness.advice ? (
          <p className={cn("text-xs font-medium", style.text)}>
            {freshness.advice}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Link
            href={`/informacion/${resource.slug}`}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary/10 px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
          >
            Ver detalle
          </Link>
          <ShareButton
            path={`/informacion/${resource.slug}`}
            title={`${resource.name} · Centro de Ayuda Manizales`}
            text={`${resource.name} — ${CATEGORY_LABELS[resource.category]}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
