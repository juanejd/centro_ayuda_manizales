import Link from "next/link";
import type { Metadata } from "next";

import { NeedCard } from "@/modules/help-requests/components/need-card";
import {
  CATEGORY_LABELS,
  HELP_REQUEST_CATEGORIES,
  isHelpRequestCategory,
} from "@/modules/help-requests/domain/validation";
import {
  UNASSIGNED_ZONE_VALUE,
  listComunas,
  listPublicHelpRequests,
  resolveHelpRequestPhotoUrl,
} from "@/modules/help-requests/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";

export const metadata: Metadata = {
  title: "Necesidades reportadas | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

// Short: this board fills from unmoderated public submissions, so a stale
// 5-minute cache (the pattern used elsewhere in this app) would miss the
// doc's own "aparece en menos de 60 s" requirement.
export const revalidate = 30;

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function firstPositiveInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function NeedsBoardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryParam = firstValue(params.categoria);
  const comunaParam = firstValue(params.comuna);
  const queryParam = firstValue(params.q)?.trim();
  const page = firstPositiveInt(firstValue(params.pagina)) ?? 1;

  const category = isHelpRequestCategory(categoryParam)
    ? categoryParam
    : undefined;

  const [{ items: needs, hasMore }, comunas] = await Promise.all([
    listPublicHelpRequests({
      categories: category ? [category] : undefined,
      comunaCode: comunaParam,
      query: queryParam,
      page,
    }),
    listComunas(),
  ]);

  const urbanComunas = comunas.filter((comuna) => comuna.kind === "urbana");
  const ruralComunas = comunas.filter((comuna) => comuna.kind === "rural");

  const hasFilters = Boolean(category || comunaParam || queryParam);

  const filterQuery = new URLSearchParams();
  if (category) filterQuery.set("categoria", category);
  if (comunaParam) filterQuery.set("comuna", comunaParam);
  if (queryParam) filterQuery.set("q", queryParam);

  const nextPageHref = (() => {
    const next = new URLSearchParams(filterQuery);
    next.set("pagina", String(page + 1));
    return `/necesidades?${next.toString()}`;
  })();

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">
            Necesidades reportadas
          </h1>
        </header>

        <Alert variant="destructive">
          <AlertTitle>Verifica antes de responder</AlertTitle>
          <AlertDescription>
            Esta información la publica cada persona directamente, sin
            revisión previa. Confirma la necesidad por teléfono antes de
            desplazarte o entregar dinero o bienes. Reporta cualquier
            publicación sospechosa a las líneas de atención.
          </AlertDescription>
        </Alert>

        <form
          method="get"
          action="/necesidades"
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q">Buscar</Label>
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={queryParam ?? ""}
              placeholder="Descripción o barrio, por ejemplo «agua»"
              className="min-h-12"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <NativeSelect
                id="categoria"
                name="categoria"
                defaultValue={category ?? ""}
                className="min-h-12 w-full"
              >
                <NativeSelectOption value="">
                  Todas las categorías
                </NativeSelectOption>
                {HELP_REQUEST_CATEGORIES.map((requestCategory) => (
                  <NativeSelectOption
                    key={requestCategory}
                    value={requestCategory}
                  >
                    {CATEGORY_LABELS[requestCategory]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comuna">Comuna</Label>
              <NativeSelect
                id="comuna"
                name="comuna"
                defaultValue={comunaParam ?? ""}
                className="min-h-12 w-full"
              >
                <NativeSelectOption value="">
                  Todas las comunas
                </NativeSelectOption>
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
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Button type="submit" className="min-h-12 px-5">
              Filtrar
            </Button>
            {hasFilters ? (
              <Link
                href="/necesidades"
                className="inline-flex min-h-12 items-center text-sm text-muted-foreground underline underline-offset-4"
              >
                Limpiar filtros
              </Link>
            ) : null}
          </div>
        </form>

        <section aria-label="Resultados" aria-live="polite">
          {needs.length === 0 ? (
            <Empty className="mt-3">
              <EmptyHeader>
                <EmptyTitle>No hay necesidades con estos filtros</EmptyTitle>
                <EmptyDescription>
                  Prueba con otra categoría, otra comuna o una palabra de
                  búsqueda distinta.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {needs.map((need) => (
                <li key={need.referenceCode}>
                  <NeedCard
                    need={need}
                    photoUrl={resolveHelpRequestPhotoUrl(need.photoPath)}
                  />
                </li>
              ))}
            </ul>
          )}

          {hasMore ? (
            <Link
              href={nextPageHref}
              className="mt-4 inline-flex min-h-12 items-center text-sm font-semibold underline underline-offset-4"
            >
              Ver más necesidades
            </Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}
