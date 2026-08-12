import Link from "next/link";

import {
  CATEGORY_LABELS,
  MODERATION_BADGE,
} from "@/modules/help-requests/domain/validation";
import type { PublicHelpRequest } from "@/modules/help-requests/queries";
import { toTelHref } from "@/modules/info-resources/domain";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

export function NeedCard({ need }: { need: PublicHelpRequest }) {
  const moderationBadge = MODERATION_BADGE[need.moderationStatus];
  const locationLine = [need.neighborhood ?? need.sector, need.comuna]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="gap-2">
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={moderationBadge.className}>
            {moderationBadge.label}
          </Badge>
          {need.fulfillmentStatus === "atendida" ? (
            <Badge className="bg-closed-surface text-closed-foreground">
              Atendida
            </Badge>
          ) : null}
        </div>

        <p className="label-caps text-muted-foreground">
          {CATEGORY_LABELS[need.category]}
          {locationLine ? ` · ${locationLine}` : ""}
        </p>

        <CardTitle>{need.contactName}</CardTitle>

        <p className="line-clamp-3 text-sm text-foreground/90">
          {need.description}
        </p>

        <a
          href={toTelHref(need.contactPhone)}
          className={cn(
            "inline-flex min-h-12 w-fit items-center font-bold text-primary underline decoration-2 underline-offset-4",
          )}
        >
          {need.contactPhone}
        </a>

        {need.affectedPeople != null ? (
          <p className="text-xs text-muted-foreground">
            {need.affectedPeople === 1
              ? "1 persona afectada"
              : `${need.affectedPeople} personas afectadas`}
          </p>
        ) : null}

        <Link
          href={`/necesidades/${need.referenceCode}`}
          className={cn(
            "inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4",
          )}
        >
          Ver detalle
        </Link>
      </CardContent>
    </Card>
  );
}
