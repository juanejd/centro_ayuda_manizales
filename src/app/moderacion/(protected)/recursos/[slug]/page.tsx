import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listComunas } from "@/modules/help-requests/queries";
import {
  addInfoResourcePhoto,
  publishInfoResource,
  removeInfoResourcePhoto,
  unpublishInfoResource,
} from "@/modules/moderation/actions/resources";
import {
  getAdminResourceBySlug,
  listResourcePhotos,
} from "@/modules/moderation/queries-resources";
import { ResourceForm } from "@/modules/moderation/components/resource-form";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { createServerSupabaseClient } from "@/shared/supabase/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const OK_MESSAGES: Record<string, string> = {
  actualizado: "Recurso actualizado.",
  publicado: "Recurso publicado.",
  despublicado: "Recurso despublicado.",
  foto_agregada: "Foto agregada.",
  foto_retirada: "Foto retirada.",
};

const ERROR_MESSAGES: Record<string, string> = {
  fuente_requerida:
    "Indica la fuente para poder marcar el recurso como verificado.",
  fecha_requerida:
    "Indica la fecha de verificación para marcar el recurso como verificado.",
  zona_invalida: "El barrio y la comuna deben corresponder entre sí.",
  datos_invalidos: "Revisa los datos del formulario.",
  actualizar: "No se pudo guardar el recurso.",
  publicar: "No se pudo cambiar la publicación del recurso.",
  texto_alternativo_requerido: "El texto alternativo es obligatorio para guardar una foto.",
  foto_requerida: "Selecciona un archivo de foto.",
  foto_invalida: "El archivo no es una imagen válida.",
  foto_procesar: "No se pudo procesar la foto.",
  foto_guardar: "No se pudo guardar la foto.",
  foto_no_encontrada: "La foto ya no existe.",
  foto_retirar: "No se pudo retirar la foto.",
};

// Converts an ISO timestamp to the "YYYY-MM-DDTHH:mm" shape a
// datetime-local input expects, in the server's local time zone — this is a
// low-traffic staff form, no timezone library elsewhere in the app either.
function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { ok, error } = await searchParams;

  const [resource, comunas] = await Promise.all([
    getAdminResourceBySlug(slug),
    listComunas(),
  ]);

  if (!resource) {
    notFound();
  }

  const photos = await listResourcePhotos(resource.resourceId);
  const supabase = createServerSupabaseClient();
  const photoUrls = photos.map((photo) => ({
    ...photo,
    url: supabase.storage
      .from("info-resource-photos")
      .getPublicUrl(photo.storagePath).data.publicUrl,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/moderacion/recursos"
        className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Volver a recursos
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
        <div>
          <p className="label-caps text-muted-foreground">{resource.slug}</p>
          <h1 className="text-2xl">{resource.name}</h1>
        </div>
        <Badge variant={resource.isPublished ? "default" : "outline"}>
          {resource.isPublished ? "Publicado" : "Sin publicar"}
        </Badge>
      </header>

      <div className="flex flex-wrap gap-3">
        {resource.isPublished ? (
          <form action={unpublishInfoResource}>
            <input type="hidden" name="slug" value={resource.slug} />
            <Button type="submit" variant="outline" className="min-h-12 px-5">
              Despublicar
            </Button>
          </form>
        ) : (
          <form action={publishInfoResource}>
            <input type="hidden" name="slug" value={resource.slug} />
            <Button type="submit" className="min-h-12 px-5">
              Publicar
            </Button>
          </form>
        )}
      </div>

      <ResourceForm
        mode="edit"
        values={{
          slug: resource.slug,
          category: resource.category,
          name: resource.name,
          description: resource.description ?? "",
          address: resource.address ?? "",
          neighborhoodCode: resource.neighborhoodCode ?? "",
          comunaCode: resource.comunaCode ?? "",
          meetingPoint: resource.meetingPoint ?? "",
          latitude: resource.latitude?.toString() ?? "",
          longitude: resource.longitude?.toString() ?? "",
          phones: resource.phones.join("\n"),
          hours: resource.hours ?? "",
          source: resource.source ?? "",
          status: resource.status,
          verifiedAt: toDateTimeLocalValue(resource.verifiedAt),
        }}
        comunas={comunas}
      />

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="label-caps text-muted-foreground">
          Fotos de referencia
        </h2>

        {photoUrls.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoUrls.map((photo) => (
              <li key={photo.photoId} className="flex flex-col gap-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- staff-only admin thumbnail, not worth next/image's config here */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    className="size-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {photo.caption}
                </p>
                <form action={removeInfoResourcePhoto}>
                  <input type="hidden" name="slug" value={resource.slug} />
                  <input
                    type="hidden"
                    name="photoId"
                    value={photo.photoId}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="min-h-10 w-full px-3 text-xs"
                  >
                    Retirar foto
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este recurso no tiene fotos.
          </p>
        )}

        <form
          action={addInfoResourcePhoto}
          encType="multipart/form-data"
          className="flex flex-col gap-3 border-t border-border pt-3"
        >
          <input type="hidden" name="slug" value={resource.slug} />
          <Field>
            <FieldLabel htmlFor="photo">Nueva foto</FieldLabel>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="text-sm"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="caption">
              Texto alternativo (obligatorio)
            </FieldLabel>
            <Input
              id="caption"
              name="caption"
              type="text"
              required
              maxLength={300}
              placeholder="Describe la foto para quien no puede verla"
              className="min-h-12"
            />
          </Field>
          <Button type="submit" variant="outline" className="min-h-12 w-fit px-5">
            Agregar foto
          </Button>
        </form>
      </section>
    </div>
  );
}
