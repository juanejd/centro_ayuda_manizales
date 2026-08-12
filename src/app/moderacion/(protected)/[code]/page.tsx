import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  assignComunaHelpRequest,
  hideHelpRequest,
  markDuplicateHelpRequest,
  removePhotoHelpRequest,
  setPriorityHelpRequest,
  verifyHelpRequest,
  withdrawHelpRequest,
} from "@/modules/moderation/actions/moderate";
import { getInboxHelpRequestByCode } from "@/modules/moderation/queries";
import {
  CATEGORY_LABELS,
  MODERATION_BADGE,
  PRIORITY_LABELS,
  PRIORITY_LEVELS,
} from "@/modules/help-requests/domain/validation";
import { listComunas } from "@/modules/help-requests/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const OK_MESSAGES: Record<string, string> = {
  verificado: "Publicación verificada.",
  oculta: "Publicación ocultada.",
  retirada: "Publicación retirada.",
  duplicado: "Marcada como duplicada.",
  prioridad: "Prioridad asignada.",
  comuna: "Zona asignada.",
  foto_retirada: "Foto retirada.",
};

const ERROR_MESSAGES: Record<string, string> = {
  ya_retirada: "Esta publicación ya fue retirada y no admite más acciones.",
  fuente_requerida: "Indica la fuente para poder verificar.",
  verificar: "No se pudo verificar. Revisa la fuente.",
  ocultar: "No se pudo ocultar la publicación.",
  retirar: "No se pudo retirar la publicación.",
  duplicado_invalido: "El radicado de la publicación original no es válido.",
  marcar_duplicado: "No se pudo marcar como duplicada.",
  prioridad_invalida: "Selecciona una prioridad válida.",
  prioridad: "No se pudo asignar la prioridad.",
  comuna_requerida: "Selecciona una comuna.",
  barrio_invalido: "El nombre del barrio no es válido.",
  barrio: "No se pudo guardar el barrio nuevo.",
  comuna: "No se pudo asignar la comuna.",
  sin_foto: "Esta publicación no tiene foto.",
  foto: "No se pudo retirar la foto.",
};

export default async function ModerationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { code } = await params;
  const { ok, error } = await searchParams;

  const [item, comunas] = await Promise.all([
    getInboxHelpRequestByCode(code),
    listComunas(),
  ]);

  if (!item) {
    notFound();
  }

  const badge = MODERATION_BADGE[item.moderationStatus];
  const urbanComunas = comunas.filter((comuna) => comuna.kind === "urbana");
  const ruralComunas = comunas.filter((comuna) => comuna.kind === "rural");
  const isWithdrawn = item.moderationStatus === "retirada";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/moderacion"
        className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Volver a la bandeja
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

      <header className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={badge.className}>{badge.label}</Badge>
          {item.fulfillmentStatus === "atendida" ? (
            <Badge className="bg-closed-surface text-closed-foreground">
              Atendida
            </Badge>
          ) : null}
          {item.priority ? (
            <Badge variant="outline">{PRIORITY_LABELS[item.priority]}</Badge>
          ) : null}
        </div>
        <p className="label-caps text-muted-foreground">
          {CATEGORY_LABELS[item.category]} · Radicado {item.referenceCode}
        </p>
        <h1 className="text-2xl">{item.contactName}</h1>
      </header>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-foreground/90">{item.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {[item.neighborhood ?? item.sector, item.comuna]
            .filter(Boolean)
            .join(" · ") || "Zona sin asignar"}
          {item.address ? ` · ${item.address}` : ""}
        </p>
        {item.latitude != null && item.longitude != null ? (
          <p className="text-sm text-muted-foreground">
            Coordenadas exactas: {item.latitude}, {item.longitude}
          </p>
        ) : null}
        <p className="mt-1 text-sm">
          <a
            href={`tel:${item.contactPhone}`}
            className="font-semibold text-primary underline underline-offset-4"
          >
            {item.contactPhone}
          </a>
        </p>
        {item.verifiedSource ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Verificado con fuente: {item.verifiedSource}
          </p>
        ) : null}
      </section>

      {isWithdrawn ? (
        <p className="text-sm text-muted-foreground">
          Esta publicación fue retirada. No admite más acciones.
        </p>
      ) : (
        <>
          {item.moderationStatus !== "verificado" ? (
            <form
              action={verifyHelpRequest}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <input type="hidden" name="code" value={item.referenceCode} />
              <p className="label-caps text-muted-foreground">Verificar</p>
              <Field>
                <FieldLabel htmlFor="source">Fuente</FieldLabel>
                <Input
                  id="source"
                  name="source"
                  type="text"
                  required
                  maxLength={160}
                  placeholder="Ej. Confirmado por llamada telefónica"
                  className="min-h-12"
                />
              </Field>
              <Button type="submit" className="min-h-12 w-fit px-5">
                Verificar
              </Button>
            </form>
          ) : null}

          <form
            action={markDuplicateHelpRequest}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <input type="hidden" name="code" value={item.referenceCode} />
            <p className="label-caps text-muted-foreground">
              Marcar duplicada
            </p>
            <Field>
              <FieldLabel htmlFor="duplicateOfCode">
                Radicado de la publicación original (opcional)
              </FieldLabel>
              <Input
                id="duplicateOfCode"
                name="duplicateOfCode"
                type="text"
                maxLength={8}
                className="min-h-12"
              />
            </Field>
            <Button
              type="submit"
              variant="outline"
              className="min-h-12 w-fit px-5"
            >
              Marcar como duplicada
            </Button>
          </form>

          <form
            action={setPriorityHelpRequest}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <input type="hidden" name="code" value={item.referenceCode} />
            <p className="label-caps text-muted-foreground">Prioridad</p>
            <Field>
              <FieldLabel htmlFor="priority">Prioridad</FieldLabel>
              <NativeSelect
                id="priority"
                name="priority"
                required
                defaultValue={item.priority ?? ""}
                className="min-h-12 w-full"
              >
                <NativeSelectOption value="" disabled hidden>
                  Selecciona una prioridad
                </NativeSelectOption>
                {PRIORITY_LEVELS.map((priority) => (
                  <NativeSelectOption key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Button type="submit" className="min-h-12 w-fit px-5">
              Asignar prioridad
            </Button>
          </form>

          <form
            action={assignComunaHelpRequest}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <input type="hidden" name="code" value={item.referenceCode} />
            <p className="label-caps text-muted-foreground">Asignar zona</p>
            <Field>
              <FieldLabel htmlFor="comunaCode">Comuna</FieldLabel>
              <NativeSelect
                id="comunaCode"
                name="comunaCode"
                required
                defaultValue={item.comunaCode ?? ""}
                className="min-h-12 w-full"
              >
                <NativeSelectOption value="" disabled hidden>
                  Selecciona una comuna
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
              <FieldLabel htmlFor="newNeighborhoodName">
                Añadir barrio nuevo al catálogo (opcional)
              </FieldLabel>
              <Input
                id="newNeighborhoodName"
                name="newNeighborhoodName"
                type="text"
                maxLength={120}
                placeholder={item.sector}
                className="min-h-12"
              />
            </Field>
            <Button type="submit" className="min-h-12 w-fit px-5">
              Guardar zona
            </Button>
          </form>

          {item.photoPath ? (
            <form
              action={removePhotoHelpRequest}
              className="rounded-xl border border-border bg-card p-4"
            >
              <input type="hidden" name="code" value={item.referenceCode} />
              <p className="text-sm text-muted-foreground">
                Retira solo la foto. La publicación sigue visible sin ella.
              </p>
              <Button
                type="submit"
                variant="outline"
                className="mt-2 min-h-12 px-5"
              >
                Retirar foto
              </Button>
            </form>
          ) : null}

          <form
            action={hideHelpRequest}
            className="rounded-xl border border-border bg-card p-4"
          >
            <input type="hidden" name="code" value={item.referenceCode} />
            <p className="text-sm text-muted-foreground">
              Oculta la publicación del tablero público sin retirarla.
            </p>
            <Button
              type="submit"
              variant="outline"
              className="mt-2 min-h-12 px-5"
            >
              Ocultar publicación
            </Button>
          </form>

          <form
            action={withdrawHelpRequest}
            className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-4"
          >
            <input type="hidden" name="code" value={item.referenceCode} />
            <p className="text-sm text-muted-foreground">
              Retirar la publicación la quita de inmediato del tablero y no
              se puede deshacer.
            </p>
            <div className="flex items-start gap-2">
              <input
                id="confirmWithdraw"
                name="confirmWithdraw"
                type="checkbox"
                required
                className="mt-0.5 size-5 shrink-0 rounded border border-input bg-transparent"
              />
              <Label
                htmlFor="confirmWithdraw"
                className="text-sm leading-snug font-normal"
              >
                Confirmo que quiero retirar esta publicación.
              </Label>
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="min-h-12 w-fit px-5"
            >
              Retirar publicación
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
