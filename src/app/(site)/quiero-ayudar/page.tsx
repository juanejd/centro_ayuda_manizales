import Link from "next/link";
import type { Metadata } from "next";
import { HandHelping } from "lucide-react";

import {
  CONTRIBUTION_CATEGORIES,
  CONTRIBUTION_LABELS,
  CONTRIBUTION_TYPES,
  isContributionType,
  type ContributionType,
} from "@/modules/help-requests/domain/contribution";
import { NeedCard } from "@/modules/help-requests/components/need-card";
import {
  UNASSIGNED_ZONE_VALUE,
  listComunas,
  listPublicHelpRequests,
  resolveHelpRequestPhotoUrl,
} from "@/modules/help-requests/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";

export const metadata: Metadata = {
  title: "Quiero ayudar | Centro de Ayuda Manizales",
  description:
    "Dinos qué puedes aportar y te mostramos quién lo necesita ahora mismo.",
};

// RF-3: this screen is a filter over the board, never a signup. No table
// row, no reference code, no confirmation screen — see "Lo que esta fase no
// construye" in docs/implementation/fase-5-quiero-ayudar.md.
export const revalidate = 30;

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function firstPositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function QuieroAyudarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tipoParam = firstValue(params.tipo);
  const comunaParam = firstValue(params.comuna);
  const page = firstPositiveInt(firstValue(params.pagina)) ?? 1;

  const tipo = isContributionType(tipoParam) ? tipoParam : undefined;
  const comunas = await listComunas();
  const urbanComunas = comunas.filter((comuna) => comuna.kind === "urbana");
  const ruralComunas = comunas.filter((comuna) => comuna.kind === "rural");

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="border-b-2 border-primary bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2">
            <HandHelping className="size-6 shrink-0 text-primary" aria-hidden="true" />
            <p className="label-caps text-muted-foreground">
              Centro de Ayuda Manizales
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl">Quiero ayudar</h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Dinos qué puedes aportar y te mostramos quién lo necesita. La
            plataforma no te registra: tú decides a quién llamar.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <form
          method="get"
          action="/quiero-ayudar"
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="tipo">¿Qué puedes aportar?</FieldLabel>
              <NativeSelect
                id="tipo"
                name="tipo"
                defaultValue={tipo ?? ""}
                required
                className="min-h-12 w-full"
              >
                <NativeSelectOption value="" disabled hidden>
                  Selecciona un tipo de aporte
                </NativeSelectOption>
                {CONTRIBUTION_TYPES.map((contributionType) => (
                  <NativeSelectOption
                    key={contributionType}
                    value={contributionType}
                  >
                    {CONTRIBUTION_LABELS[contributionType]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="comuna">Comuna (opcional)</FieldLabel>
              <NativeSelect
                id="comuna"
                name="comuna"
                defaultValue={comunaParam ?? ""}
                className="min-h-12 w-full"
              >
                <NativeSelectOption value="">Toda Manizales</NativeSelectOption>
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
          </div>

          <Button type="submit" className="min-h-12 w-fit px-5">
            Ver quién lo necesita
          </Button>
        </form>

        {tipo ? (
          <ContributionResults
            tipo={tipo}
            comunaCode={comunaParam}
            page={page}
          />
        ) : null}
      </div>
    </main>
  );
}

async function ContributionResults({
  tipo,
  comunaCode,
  page,
}: {
  tipo: ContributionType;
  comunaCode: string | undefined;
  page: number;
}) {
  if (tipo === "dinero") {
    return (
      <Alert>
        <AlertTitle>La plataforma no recibe ni administra dinero</AlertTitle>
        <AlertDescription>
          <p className="mt-1">
            Ningún aporte en efectivo se gestiona aquí. Consulta el centro de
            información para conocer las entidades autorizadas que reciben
            donaciones en dinero.
          </p>
          <p className="mt-2">
            <Link
              href="/informacion"
              className="font-semibold underline underline-offset-4"
            >
              Ir al centro de información
            </Link>
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  const mapping = CONTRIBUTION_CATEGORIES[tipo];
  // "none" only ever belongs to "dinero", already handled above — this is
  // just satisfying the type, not a reachable runtime branch.
  const categories =
    mapping === "all" || mapping === "none" ? undefined : mapping;

  const { items: needs, hasMore } = await listPublicHelpRequests({
    categories,
    comunaCode,
    page,
  });

  const filterQuery = new URLSearchParams({ tipo });
  if (comunaCode) filterQuery.set("comuna", comunaCode);
  const nextPageHref = (() => {
    const next = new URLSearchParams(filterQuery);
    next.set("pagina", String(page + 1));
    return `/quiero-ayudar?${next.toString()}`;
  })();

  return (
    <div className="flex flex-col gap-3">
      {tipo === "tiempo_voluntario" ? (
        <Alert>
          <AlertTitle>El módulo de voluntariado no está disponible</AlertTitle>
          <AlertDescription>
            Por ahora no hay una forma de que la plataforma te asigne una
            tarea. Mira las necesidades actuales abajo y contacta
            directamente a quien puedas ayudar.
          </AlertDescription>
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {needs.length === 0
          ? "No hay coincidencias en este momento."
          : needs.length === 1
            ? "1 necesidad coincide con lo que puedes aportar."
            : `${needs.length} necesidades coinciden con lo que puedes aportar.`}
      </p>

      {needs.length === 0 ? (
        <Alert>
          <AlertTitle>Sin coincidencias por ahora</AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              No hay necesidades abiertas que correspondan a este aporte en
              este momento.
            </p>
            <p className="mt-2">
              <Link
                href="/necesidades"
                className="font-semibold underline underline-offset-4"
              >
                Ver el tablero completo
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          className="inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4"
        >
          Ver más necesidades
        </Link>
      ) : null}
    </div>
  );
}
