import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Phone, Users } from "lucide-react";

import { CATEGORY_ICONS } from "@/modules/help-requests/components/category-icon";
import {
  CATEGORY_LABELS,
  MODERATION_BADGE,
} from "@/modules/help-requests/domain/validation";
import type { PublicHelpRequest } from "@/modules/help-requests/queries";
import { toTelHref, toWhatsAppHref } from "@/modules/info-resources/domain";
import { ShareButton } from "@/shared/components/share-button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

function whatsAppMessage(need: PublicHelpRequest): string {
  return `Hola ${need.contactName}, vi tu publicación en el Centro de Ayuda Manizales (radicado ${need.referenceCode}) sobre "${CATEGORY_LABELS[need.category]}" y quiero ayudarte.`;
}

export function NeedCard({
  need,
  photoUrl,
}: {
  need: PublicHelpRequest;
  // Resolved server-side (Supabase Storage getPublicUrl) by the page
  // rendering this card — the card itself never talks to storage.
  photoUrl?: string | null;
}) {
  const moderationBadge = MODERATION_BADGE[need.moderationStatus];
  const locationLine = [need.neighborhood ?? need.sector, need.comuna]
    .filter(Boolean)
    .join(" · ");
  const CategoryIcon = CATEGORY_ICONS[need.category];

  return (
    <Card
      className={cn(
        "h-full gap-2 transition-shadow duration-200 hover:shadow-md",
        photoUrl && "pt-0",
      )}
    >
      {photoUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl bg-muted">
          <Image
            src={photoUrl}
            alt={`Foto de la necesidad ${need.referenceCode}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute top-2.5 left-2.5 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <CategoryIcon className="size-4.5" aria-hidden="true" />
          </span>
        </div>
      ) : null}
      <CardContent className="flex flex-1 flex-col gap-1.5">
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

        <p className="label-caps flex items-center gap-1.5 text-muted-foreground">
          {photoUrl ? null : (
            <CategoryIcon className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          {CATEGORY_LABELS[need.category]}
          {locationLine ? ` · ${locationLine}` : ""}
        </p>

        <CardTitle className="text-lg">{need.contactName}</CardTitle>

        <p className="line-clamp-3 text-sm text-foreground/90">
          {need.description}
        </p>

        {need.affectedPeople != null ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            {need.affectedPeople === 1
              ? "1 persona afectada"
              : `${need.affectedPeople} personas afectadas`}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <a
            href={toTelHref(need.contactPhone)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
          >
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            {need.contactPhone}
          </a>

          <a
            href={toWhatsAppHref(need.contactPhone, whatsAppMessage(need))}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-3 text-sm font-bold text-[#0d6e41] transition-colors hover:bg-[#25D366]/25 dark:text-[#3ddc84]"
          >
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            WhatsApp
          </a>

          <ShareButton
            path={`/necesidades/${need.referenceCode}`}
            title={`${CATEGORY_LABELS[need.category]} · Centro de Ayuda Manizales`}
            text={`${need.contactName} necesita ayuda con: ${need.description}`}
          />

          <Link
            href={`/necesidades/${need.referenceCode}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Ver detalle
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
