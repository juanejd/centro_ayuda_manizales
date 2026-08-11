import Link from "next/link";
import type { Metadata } from "next";

import {
  CATEGORY_LABELS,
  RESOURCE_CATEGORIES,
  isResourceCategory,
} from "@/modules/info-resources/domain";
import { listComunas, listResources } from "@/modules/info-resources/queries";
import { ResourceCard } from "@/modules/info-resources/components/resource-card";
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
  title: "Centro de información | Centro de Ayuda Manizales",
  description:
    "Directorio filtrable de albergues, hospitales y recursos oficiales verificados para la emergencia en Manizales.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InformacionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryParam = firstValue(params.categoria);
  const comunaParam = firstValue(params.comuna);
  const queryParam = firstValue(params.q)?.trim();

  const category = isResourceCategory(categoryParam) ? categoryParam : undefined;

  const [resources, comunas] = await Promise.all([
    listResources({ category, comuna: comunaParam, query: queryParam }),
    listComunas(),
  ]);

  const urbanComunas = comunas.filter((comuna) => comuna.kind === "urbana");
  const ruralComunas = comunas.filter((comuna) => comuna.kind === "rural");

  const hasFilters = Boolean(category || comunaParam || queryParam);

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Centro de información</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Albergues, atención médica y recursos oficiales verificados para la
            emergencia.
          </p>
        </header>

        <form
          method="get"
          action="/informacion"
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q">Buscar</Label>
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={queryParam ?? ""}
              placeholder="Nombre o descripción, por ejemplo «hospi»"
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
                {RESOURCE_CATEGORIES.map((resourceCategory) => (
                  <NativeSelectOption
                    key={resourceCategory}
                    value={resourceCategory}
                  >
                    {CATEGORY_LABELS[resourceCategory]}
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
                href="/informacion"
                className="inline-flex min-h-12 items-center text-sm text-muted-foreground underline underline-offset-4"
              >
                Limpiar filtros
              </Link>
            ) : null}
          </div>
        </form>

        <section aria-label="Resultados" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            {resources.length === 1
              ? "1 recurso encontrado"
              : `${resources.length} recursos encontrados`}
          </p>

          {resources.length === 0 ? (
            <Empty className="mt-3">
              <EmptyHeader>
                <EmptyTitle>No encontramos recursos con estos filtros</EmptyTitle>
                <EmptyDescription>
                  Prueba con otra categoría, otra comuna o una palabra de
                  búsqueda distinta.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {resources.map((resource) => (
                <li key={resource.slug}>
                  <ResourceCard resource={resource} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
