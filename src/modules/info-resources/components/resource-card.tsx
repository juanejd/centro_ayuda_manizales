import {
  CATEGORY_LABELS,
  UNCONFIRMED_INFO_SENTENCE,
  type FreshnessLevel,
} from "@/modules/info-resources/domain";
import type { DirectoryResource } from "@/modules/info-resources/queries";
import { Card, CardContent, CardTitle } from "@/shared/ui/card";
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

export function ResourceCard({ resource }: { resource: DirectoryResource }) {
  const { freshness } = resource;
  const style = FRESHNESS_STYLES[freshness.level];
  const locationLine = resource.address ?? resource.neighborhood;

  return (
    <Card className={cn("gap-2 border-l-4", style.strip)}>
      <CardContent className="flex flex-col gap-1.5">
        <p className={cn("label-caps", style.text)}>
          {freshness.label} · {CATEGORY_LABELS[resource.category]}
          {resource.comuna ? ` · ${resource.comuna}` : ""}
        </p>

        <CardTitle>{resource.name}</CardTitle>

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
      </CardContent>
    </Card>
  );
}
