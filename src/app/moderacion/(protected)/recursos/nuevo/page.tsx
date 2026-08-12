import Link from "next/link";
import type { Metadata } from "next";

import { listComunas } from "@/modules/help-requests/queries";
import {
  EMPTY_RESOURCE_FORM_VALUES,
  ResourceForm,
} from "@/modules/moderation/components/resource-form";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

export const metadata: Metadata = {
  title: "Nuevo recurso institucional | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  slug_invalido: "El identificador debe usar minúsculas, números y guiones.",
  slug_duplicado: "Ya existe un recurso con ese identificador.",
  fuente_requerida: "Indica la fuente para poder marcar el recurso como verificado.",
  fecha_requerida: "Indica la fecha de verificación para marcar el recurso como verificado.",
  zona_invalida: "El barrio y la comuna deben corresponder entre sí.",
  datos_invalidos: "Revisa los datos del formulario.",
  crear: "No se pudo crear el recurso. Intenta de nuevo.",
};

export default async function NewResourcePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const comunas = await listComunas();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/moderacion/recursos"
        className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Volver a recursos
      </Link>

      <header>
        <h1 className="text-2xl">Nuevo recurso institucional</h1>
      </header>

      {error && ERROR_MESSAGES[error] ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo crear el recurso</AlertTitle>
          <AlertDescription>{ERROR_MESSAGES[error]}</AlertDescription>
        </Alert>
      ) : null}

      <ResourceForm
        mode="create"
        values={EMPTY_RESOURCE_FORM_VALUES}
        comunas={comunas}
      />
    </div>
  );
}
