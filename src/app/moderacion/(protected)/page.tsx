import Link from "next/link";
import type { Metadata } from "next";

import {
  CATEGORY_LABELS,
  HELP_REQUEST_CATEGORIES,
  MODERATION_BADGE,
  PRIORITY_LABELS,
  PRIORITY_LEVELS,
  type ModerationStatus,
} from "@/modules/help-requests/domain/validation";
import {
  UNASSIGNED_ZONE_VALUE,
  listComunas,
} from "@/modules/help-requests/queries";
import { listInboxHelpRequests } from "@/modules/moderation/queries";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";

export const metadata: Metadata = {
  title: "Bandeja de moderación | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

const MODERATION_STATUS_VALUES: ModerationStatus[] = [
  "sin_verificar",
  "verificado",
  "duplicado",
  "oculta",
  "retirada",
];

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function firstPositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function ModerationInboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryParam = firstValue(params.categoria);
  const comunaParam = firstValue(params.comuna);
  const statusParam = firstValue(params.estado);
  const priorityParam = firstValue(params.prioridad);
  const page = firstPositiveInt(firstValue(params.pagina)) ?? 1;

  const [{ items: requests, hasMore }, comunas] = await Promise.all([
    listInboxHelpRequests({
      category: categoryParam,
      comunaCode: comunaParam,
      moderationStatus: statusParam,
      priority: priorityParam,
      page,
    }),
    listComunas(),
  ]);

  const urbanComunas = comunas.filter((comuna) => comuna.kind === "urbana");
  const ruralComunas = comunas.filter((comuna) => comuna.kind === "rural");

  const filterQuery = new URLSearchParams();
  if (categoryParam) filterQuery.set("categoria", categoryParam);
  if (comunaParam) filterQuery.set("comuna", comunaParam);
  if (statusParam) filterQuery.set("estado", statusParam);
  if (priorityParam) filterQuery.set("prioridad", priorityParam);
  const nextPageHref = (() => {
    const next = new URLSearchParams(filterQuery);
    next.set("pagina", String(page + 1));
    return `/moderacion?${next.toString()}`;
  })();

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl">Bandeja de moderación</h1>
      </header>

      <form
        method="get"
        action="/moderacion"
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field>
            <FieldLabel htmlFor="categoria">Categoría</FieldLabel>
            <NativeSelect
              id="categoria"
              name="categoria"
              defaultValue={categoryParam ?? ""}
              className="min-h-12 w-full"
            >
              <NativeSelectOption value="">Todas</NativeSelectOption>
              {HELP_REQUEST_CATEGORIES.map((category) => (
                <NativeSelectOption key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="comuna">Comuna</FieldLabel>
            <NativeSelect
              id="comuna"
              name="comuna"
              defaultValue={comunaParam ?? ""}
              className="min-h-12 w-full"
            >
              <NativeSelectOption value="">Todas</NativeSelectOption>
              <NativeSelectOption value={UNASSIGNED_ZONE_VALUE}>
                Zona sin asignar
              </NativeSelectOption>
              {urbanComunas.length > 0 ? (
                <NativeSelectOptGroup label="Comunas urbanas">
                  {urbanComunas.map((comuna) => (
                    <NativeSelectOption
                      key={comuna.comuna_code}
                      value={comuna.comuna_code}
                    >
                      {comuna.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>
              ) : null}
              {ruralComunas.length > 0 ? (
                <NativeSelectOptGroup label="Corregimientos">
                  {ruralComunas.map((comuna) => (
                    <NativeSelectOption
                      key={comuna.comuna_code}
                      value={comuna.comuna_code}
                    >
                      {comuna.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>
              ) : null}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="estado">Estado</FieldLabel>
            <NativeSelect
              id="estado"
              name="estado"
              defaultValue={statusParam ?? ""}
              className="min-h-12 w-full"
            >
              <NativeSelectOption value="">Todos</NativeSelectOption>
              {MODERATION_STATUS_VALUES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {MODERATION_BADGE[status].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="prioridad">Prioridad</FieldLabel>
            <NativeSelect
              id="prioridad"
              name="prioridad"
              defaultValue={priorityParam ?? ""}
              className="min-h-12 w-full"
            >
              <NativeSelectOption value="">Todas</NativeSelectOption>
              <NativeSelectOption value="sin-asignar">
                Sin asignar
              </NativeSelectOption>
              {PRIORITY_LEVELS.map((priority) => (
                <NativeSelectOption key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Button type="submit" className="min-h-12 px-5">
            Filtrar
          </Button>
          <Link
            href="/moderacion"
            className="inline-flex min-h-12 items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Limpiar filtros
          </Link>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {requests.length === 1
          ? "1 publicación"
          : `${requests.length} publicaciones`}
      </p>

      <ul className="flex flex-col gap-3">
        {requests.map((item) => {
          const badge = MODERATION_BADGE[item.moderationStatus];
          return (
            <li
              key={item.requestId}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className={badge.className}>{badge.label}</Badge>
                {item.fulfillmentStatus === "atendida" ? (
                  <Badge className="bg-closed-surface text-closed-foreground">
                    Atendida
                  </Badge>
                ) : null}
                {item.priority ? (
                  <Badge variant="outline">
                    {PRIORITY_LABELS[item.priority]}
                  </Badge>
                ) : null}
              </div>

              <p className="label-caps text-muted-foreground mt-2">
                {CATEGORY_LABELS[item.category]} · Radicado{" "}
                {item.referenceCode}
              </p>
              <p className="mt-1 font-semibold">{item.contactName}</p>
              <p className="text-sm text-foreground/90">{item.description}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {[item.neighborhood ?? item.sector, item.comuna]
                  .filter(Boolean)
                  .join(" · ") || "Zona sin asignar"}
                {item.latitude != null && item.longitude != null
                  ? ` · ${item.latitude}, ${item.longitude}`
                  : ""}
              </p>

              <p className="mt-1 text-sm">
                <a
                  href={`tel:${item.contactPhone}`}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {item.contactPhone}
                </a>
              </p>

              <Link
                href={`/moderacion/${item.referenceCode}`}
                className="mt-2 inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4"
              >
                Gestionar
              </Link>
            </li>
          );
        })}
      </ul>

      {hasMore ? (
        <Link
          href={nextPageHref}
          className="inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4"
        >
          Ver más
        </Link>
      ) : null}
    </div>
  );
}
