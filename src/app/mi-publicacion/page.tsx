import type { Metadata } from "next";
import Link from "next/link";

import {
  CATEGORY_LABELS,
  HELP_REQUEST_CATEGORIES,
  MODERATION_BADGE,
} from "@/modules/help-requests/domain/validation";
import { resolveManagedHelpRequest } from "@/modules/help-requests/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";

export const metadata: Metadata = {
  title: "Gestionar mi publicación | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

const OK_MESSAGES: Record<string, string> = {
  resuelta: "Marcada como resuelta.",
  retirada: "Tu publicación fue retirada. Ya no aparece en el tablero.",
  corregido: "Cambios guardados.",
};

type ManagePageProps = {
  searchParams: Promise<{
    code?: string;
    token?: string;
    ok?: string;
    error?: string;
  }>;
};

export default async function ManageHelpRequestPage({
  searchParams,
}: ManagePageProps) {
  const { code, token, ok, error } = await searchParams;

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Gestionar mi publicación</h1>
        </header>

        {!code || !token ? (
          <EnterCodeForm />
        ) : (
          <ManageRequest code={code} token={token} ok={ok} error={error} />
        )}

        <p className="text-sm text-muted-foreground">
          ¿Perdiste el enlace de gestión? Escríbenos por una{" "}
          <Link href="/lineas-atencion" className="underline underline-offset-4">
            línea de atención
          </Link>{" "}
          indicando tu radicado para solicitar el retiro manual.
        </p>
      </div>
    </main>
  );
}

function EnterCodeForm() {
  return (
    <form
      method="get"
      action="/mi-publicacion"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      <p className="text-sm text-muted-foreground">
        Ingresa el radicado y el token del enlace de gestión que recibiste al
        publicar.
      </p>
      <Field>
        <FieldLabel htmlFor="code">Radicado</FieldLabel>
        <Input id="code" name="code" type="text" required className="min-h-12" />
      </Field>
      <Field>
        <FieldLabel htmlFor="token">Token</FieldLabel>
        <Input id="token" name="token" type="text" required className="min-h-12" />
      </Field>
      <Button type="submit" className="min-h-12 px-5">
        Buscar mi publicación
      </Button>
    </form>
  );
}

async function ManageRequest({
  code,
  token,
  ok,
  error,
}: {
  code: string;
  token: string;
  ok?: string;
  error?: string;
}) {
  const managed = await resolveManagedHelpRequest(code, token);

  if (!managed) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Código o enlace incorrecto</AlertTitle>
        <AlertDescription>
          Revisa el enlace de gestión que guardaste al publicar la necesidad.
        </AlertDescription>
      </Alert>
    );
  }

  const badge = MODERATION_BADGE[managed.moderationStatus];
  const okMessage = ok ? OK_MESSAGES[ok] : undefined;

  return (
    <div className="flex flex-col gap-4">
      {okMessage ? (
        <Alert className="border-primary">
          <AlertTitle>Listo</AlertTitle>
          <AlertDescription>{okMessage}</AlertDescription>
        </Alert>
      ) : null}

      {error === "validacion" ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>
            Revisa los datos: descripción de al menos 10 caracteres, teléfono
            válido y todos los campos obligatorios completos.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={badge.className}>{badge.label}</Badge>
          {managed.fulfillmentStatus === "atendida" ? (
            <Badge className="bg-closed-surface text-closed-foreground">
              Atendida
            </Badge>
          ) : null}
        </div>
        <p className="label-caps text-muted-foreground mt-2">
          Radicado {managed.referenceCode}
        </p>
      </div>

      {managed.moderationStatus === "retirada" ? (
        <p className="text-sm text-muted-foreground">
          Esta necesidad ya fue retirada y no se puede modificar.
        </p>
      ) : (
        <>
          {managed.fulfillmentStatus === "abierta" ? (
            <form
              method="post"
              action="/api/mi-publicacion"
              className="rounded-xl border border-border bg-card p-4"
            >
              <input type="hidden" name="code" value={managed.referenceCode} />
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="action" value="resolver" />
              <p className="text-sm text-muted-foreground">
                ¿Ya resolviste esta necesidad?
              </p>
              <Button type="submit" className="mt-2 min-h-12 px-5">
                Marcar como resuelta
              </Button>
            </form>
          ) : null}

          <form
            method="post"
            action="/api/mi-publicacion"
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <input type="hidden" name="code" value={managed.referenceCode} />
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="corregir" />

            <p className="label-caps text-muted-foreground">
              Corregir información
            </p>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="category">Categoría</FieldLabel>
                <NativeSelect
                  id="category"
                  name="category"
                  defaultValue={managed.category}
                  required
                  className="min-h-12 w-full"
                >
                  {HELP_REQUEST_CATEGORIES.map((requestCategory) => (
                    <NativeSelectOption
                      key={requestCategory}
                      value={requestCategory}
                    >
                      {CATEGORY_LABELS[requestCategory]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Descripción</FieldLabel>
                <textarea
                  id="description"
                  name="description"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  defaultValue={managed.description}
                  className="min-h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none md:text-sm dark:bg-input/30"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="sector">Sector o barrio</FieldLabel>
                <Input
                  id="sector"
                  name="sector"
                  type="text"
                  required
                  minLength={2}
                  maxLength={160}
                  defaultValue={managed.sector}
                  className="min-h-12"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="contactName">Tu nombre</FieldLabel>
                <Input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={160}
                  defaultValue={managed.contactName}
                  className="min-h-12"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="contactPhone">Tu teléfono</FieldLabel>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  required
                  minLength={7}
                  maxLength={25}
                  pattern={String.raw`[0-9+\(\)#* \-]{7,25}`}
                  defaultValue={managed.contactPhone}
                  className="min-h-12"
                />
              </Field>

              <Button type="submit" className="min-h-12 px-5">
                Guardar cambios
              </Button>
            </FieldGroup>
          </form>

          <form
            method="post"
            action="/api/mi-publicacion"
            className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-4"
          >
            <input type="hidden" name="code" value={managed.referenceCode} />
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="retirar" />

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
