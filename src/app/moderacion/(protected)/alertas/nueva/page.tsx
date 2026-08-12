import Link from "next/link";
import type { Metadata } from "next";

import {
  AlertForm,
  EMPTY_ALERT_FORM_VALUES,
} from "@/modules/moderation/components/alert-form";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

export const metadata: Metadata = {
  title: "Nueva alerta | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  fuente_requerida: "Indica la fuente de la alerta.",
  fecha_invalida: "La fecha de vencimiento no es válida.",
  datos_invalidos: "Revisa los datos del formulario.",
  crear: "No se pudo crear la alerta. Intenta de nuevo.",
};

export default async function NewAlertPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/moderacion/alertas"
        className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Volver a alertas
      </Link>

      <header>
        <h1 className="text-2xl">Nueva alerta</h1>
      </header>

      {error && ERROR_MESSAGES[error] ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo crear la alerta</AlertTitle>
          <AlertDescription>{ERROR_MESSAGES[error]}</AlertDescription>
        </Alert>
      ) : null}

      <AlertForm mode="create" values={EMPTY_ALERT_FORM_VALUES} />
    </div>
  );
}
