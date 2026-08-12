import Link from "next/link";
import type { Metadata } from "next";

import {
  CATEGORY_LABELS,
  RESOURCE_CATEGORIES,
  RESOURCE_STATUSES,
} from "@/modules/info-resources/domain";
import { listAdminResources } from "@/modules/moderation/queries-resources";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/shared/ui/native-select";

export const metadata: Metadata = {
  title: "Recursos institucionales | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<(typeof RESOURCE_STATUSES)[number], string> = {
  verificado: "Verificado",
  pendiente: "Pendiente",
  desactualizado: "Desactualizado",
  cerrado: "Cerrado",
};

const STATUS_BADGE_CLASSNAME: Record<
  (typeof RESOURCE_STATUSES)[number],
  string
> = {
  verificado: "bg-verified-surface text-verified-foreground",
  pendiente: "bg-stale-surface text-stale-foreground",
  desactualizado: "bg-stale-surface text-stale-foreground",
  cerrado: "bg-closed-surface text-closed-foreground",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// RF-6.5 — this list deliberately shows every status and both published and
// unpublished resources, unlike the public directory (listResources() in
// info-resources/queries.ts), same "shows what the public view hides"
// pattern as the help_requests inbox (unit 6.2).
export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryParam = firstValue(params.categoria);
  const statusParam = firstValue(params.estado);

  const resources = await listAdminResources({
    category: categoryParam,
    status: statusParam,
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl">Recursos institucionales</h1>
        <Button asChild className="min-h-12 px-5">
          <Link href="/moderacion/recursos/nuevo">Nuevo recurso</Link>
        </Button>
      </header>

      <form
        method="get"
        action="/moderacion/recursos"
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="categoria">Categoría</FieldLabel>
            <NativeSelect
              id="categoria"
              name="categoria"
              defaultValue={categoryParam ?? ""}
              className="min-h-12 w-full"
            >
              <NativeSelectOption value="">Todas</NativeSelectOption>
              {RESOURCE_CATEGORIES.map((category) => (
                <NativeSelectOption key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </NativeSelectOption>
              ))}
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
              {RESOURCE_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {STATUS_LABELS[status]}
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
            href="/moderacion/recursos"
            className="inline-flex min-h-12 items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Limpiar filtros
          </Link>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {resources.length === 1 ? "1 recurso" : `${resources.length} recursos`}
      </p>

      <ul className="flex flex-col gap-3">
        {resources.map((resource) => (
          <li
            key={resource.resourceId}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={STATUS_BADGE_CLASSNAME[resource.status]}>
                {STATUS_LABELS[resource.status]}
              </Badge>
              <Badge variant={resource.isPublished ? "default" : "outline"}>
                {resource.isPublished ? "Publicado" : "Sin publicar"}
              </Badge>
            </div>
            <p className="label-caps text-muted-foreground mt-2">
              {CATEGORY_LABELS[resource.category]}
            </p>
            <p className="mt-1 font-semibold">{resource.name}</p>
            <p className="text-sm text-muted-foreground">
              Fuente: {resource.source ?? "Sin fuente"}
            </p>
            <Link
              href={`/moderacion/recursos/${resource.slug}`}
              className="mt-2 inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4"
            >
              Gestionar
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
