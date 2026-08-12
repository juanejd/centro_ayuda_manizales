import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  expireAlert,
  publishAlert,
  unpublishAlert,
} from "@/modules/moderation/actions/alerts";
import { getAdminAlertById } from "@/modules/moderation/queries-alerts";
import { AlertForm } from "@/modules/moderation/components/alert-form";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const OK_MESSAGES: Record<string, string> = {
  actualizada: "Alerta actualizada.",
  publicada: "Alerta publicada.",
  despublicada: "Alerta despublicada.",
  vencida: "Alerta vencida. Ya no se muestra en la pantalla principal.",
};

const ERROR_MESSAGES: Record<string, string> = {
  fuente_requerida: "Indica la fuente de la alerta.",
  fecha_invalida: "La fecha de vencimiento no es válida.",
  datos_invalidos: "Revisa los datos del formulario.",
  actualizar: "No se pudo guardar la alerta.",
  publicar: "No se pudo cambiar la publicación de la alerta.",
  vencer: "No se pudo vencer la alerta.",
};

function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && new Date(expiresAt) <= new Date();
}

export default async function EditAlertPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;

  const alertId = Number.parseInt(id, 10);
  if (!Number.isInteger(alertId)) {
    notFound();
  }

  const alert = await getAdminAlertById(alertId);
  if (!alert) {
    notFound();
  }

  const expired = isExpired(alert.expiresAt);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/moderacion/alertas"
        className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Volver a alertas
      </Link>

      {ok && OK_MESSAGES[ok] ? (
        <Alert className="border-primary">
          <AlertTitle>Listo</AlertTitle>
          <AlertDescription>{OK_MESSAGES[ok]}</AlertDescription>
        </Alert>
      ) : null}
      {error && ERROR_MESSAGES[error] ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo completar la acción</AlertTitle>
          <AlertDescription>{ERROR_MESSAGES[error]}</AlertDescription>
        </Alert>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl">{alert.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={alert.isPublished ? "default" : "outline"}>
            {alert.isPublished ? "Publicada" : "Sin publicar"}
          </Badge>
          {expired ? (
            <Badge className="bg-closed-surface text-closed-foreground">
              Vencida
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        {alert.isPublished ? (
          <form action={unpublishAlert}>
            <input type="hidden" name="alertId" value={alert.alertId} />
            <Button type="submit" variant="outline" className="min-h-12 px-5">
              Despublicar
            </Button>
          </form>
        ) : (
          <form action={publishAlert}>
            <input type="hidden" name="alertId" value={alert.alertId} />
            <Button type="submit" className="min-h-12 px-5">
              Publicar
            </Button>
          </form>
        )}

        {!expired ? (
          <form action={expireAlert}>
            <input type="hidden" name="alertId" value={alert.alertId} />
            <Button type="submit" variant="destructive" className="min-h-12 px-5">
              Vencer ahora
            </Button>
          </form>
        ) : null}
      </div>

      <AlertForm
        mode="edit"
        values={{
          alertId: alert.alertId,
          title: alert.title,
          description: alert.description,
          source: alert.source,
          expiresAt: toDateTimeLocalValue(alert.expiresAt),
        }}
      />
    </div>
  );
}
