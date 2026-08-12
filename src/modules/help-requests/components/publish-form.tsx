"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { publishFormAction } from "@/modules/help-requests/actions/publish-form-action";
import type { PublishHelpRequestResult } from "@/modules/help-requests/actions/publish";
import {
  CATEGORY_LABELS,
  HELP_REQUEST_CATEGORIES,
} from "@/modules/help-requests/domain/validation";
import type {
  ComunaOption,
  NeighborhoodOption,
} from "@/modules/help-requests/queries";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";
import { cn } from "@/shared/lib/utils";

// Same visual tokens as src/shared/ui/input.tsx, reused by hand here because
// there is no shared <Textarea> component in src/shared/ui yet.
const TEXTAREA_CLASSNAME = cn(
  "min-h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
);

// Same visual tokens as Input's border/focus-ring, adapted for a native
// checkbox. Deliberately NOT the shadcn/Radix Checkbox: Radix renders a
// <button>, which does not participate in native <form> submission or
// `required` validation, and this form must fully work with JavaScript
// disabled.
const CHECKBOX_CLASSNAME =
  "mt-0.5 size-5 shrink-0 rounded border border-input bg-transparent align-middle outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

type PublishFormProps = {
  comunas: ComunaOption[];
  neighborhoods: NeighborhoodOption[];
};

type PublishFormState = PublishHelpRequestResult | null;

function fieldErrorList(
  state: PublishFormState,
  field: string,
): Array<{ message: string }> | undefined {
  const messages = state?.fieldErrors[field];
  return messages?.map((message) => ({ message }));
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="min-h-12 px-6">
      {pending ? "Publicando..." : "Publicar necesidad"}
    </Button>
  );
}

export function PublishForm({ comunas, neighborhoods }: PublishFormProps) {
  const [state, formAction] = useActionState(publishFormAction, null);

  const urbanComunas = comunas.filter((comuna) => comuna.kind === "urbana");
  const ruralComunas = comunas.filter((comuna) => comuna.kind === "rural");

  const neighborhoodsByComuna = new Map<string, NeighborhoodOption[]>();
  for (const neighborhood of neighborhoods) {
    const group = neighborhoodsByComuna.get(neighborhood.comuna_code) ?? [];
    group.push(neighborhood);
    neighborhoodsByComuna.set(neighborhood.comuna_code, group);
  }

  return (
    <form
      action={formAction}
      method="post"
      encType="multipart/form-data"
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-4"
    >
      {state?.formError ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo publicar</AlertTitle>
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      ) : null}

      {/* Must render before every field, not just before contactPhone: the
          doc requires it visible without scrolling on load, and this form
          has several fields ahead of the contact section. */}
      <Alert variant="destructive">
        <AlertTitle>Tu nombre, tu teléfono y tu foto serán públicos</AlertTitle>
        <AlertDescription>
          Cualquier persona que visite el tablero podrá verlos, sin
          necesidad de cuenta. No publiques datos de otra persona sin su
          autorización.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="category">Categoría de la necesidad</FieldLabel>
          <NativeSelect
            id="category"
            name="category"
            required
            defaultValue=""
            aria-invalid={Boolean(fieldErrorList(state, "category"))}
            className="min-h-12 w-full"
          >
            <NativeSelectOption value="" disabled hidden>
              Selecciona una categoría
            </NativeSelectOption>
            {HELP_REQUEST_CATEGORIES.map((category) => (
              <NativeSelectOption key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={fieldErrorList(state, "category")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">
            Describe la necesidad
          </FieldLabel>
          <FieldDescription>Entre 10 y 2000 caracteres.</FieldDescription>
          <textarea
            id="description"
            name="description"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            aria-invalid={Boolean(fieldErrorList(state, "description"))}
            className={TEXTAREA_CLASSNAME}
          />
          <FieldError errors={fieldErrorList(state, "description")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="sector">Sector o barrio (como lo conoces)</FieldLabel>
          <FieldDescription>
            Escribe el nombre aunque no esté en el catálogo oficial.
          </FieldDescription>
          <Input
            id="sector"
            name="sector"
            type="text"
            required
            minLength={2}
            maxLength={160}
            aria-invalid={Boolean(fieldErrorList(state, "sector"))}
            className="min-h-12"
          />
          <FieldError errors={fieldErrorList(state, "sector")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="neighborhoodCode">
            Barrio del catálogo (opcional)
          </FieldLabel>
          {/* No-JS tradeoff: a single select can't also fill a second
              <select name="comunaCode"> field without JavaScript, so this
              select and the comunaCode select below are independent. A user
              could in theory pick a barrio from one comuna and a different
              comuna below; the Server Action already defends against that
              mismatch via verifyNeighborhoodComunaPair, returning a clear
              field error. A single select that derives both is a future JS
              enhancement, not a gap in this unit. */}
          <NativeSelect
            id="neighborhoodCode"
            name="neighborhoodCode"
            defaultValue=""
            aria-invalid={Boolean(fieldErrorList(state, "neighborhoodCode"))}
            className="min-h-12 w-full"
          >
            <NativeSelectOption value="">
              -- No indicar barrio --
            </NativeSelectOption>
            {comunas.map((comuna) => {
              const group = neighborhoodsByComuna.get(comuna.comuna_code);
              if (!group || group.length === 0) {
                return null;
              }
              return (
                <NativeSelectOptGroup key={comuna.comuna_code} label={comuna.name}>
                  {group.map((neighborhood) => (
                    <NativeSelectOption
                      key={neighborhood.neighborhood_code}
                      value={neighborhood.neighborhood_code}
                    >
                      {neighborhood.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>
              );
            })}
          </NativeSelect>
          <FieldError errors={fieldErrorList(state, "neighborhoodCode")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="comunaCode">Comuna (opcional)</FieldLabel>
          <NativeSelect
            id="comunaCode"
            name="comunaCode"
            defaultValue=""
            aria-invalid={Boolean(fieldErrorList(state, "comunaCode"))}
            className="min-h-12 w-full"
          >
            <NativeSelectOption value="">
              -- No indicar comuna --
            </NativeSelectOption>
            {urbanComunas.length > 0 ? (
              <NativeSelectOptGroup label="Comunas urbanas">
                {urbanComunas.map((comuna) => (
                  <NativeSelectOption key={comuna.comuna_code} value={comuna.comuna_code}>
                    {comuna.name}
                  </NativeSelectOption>
                ))}
              </NativeSelectOptGroup>
            ) : null}
            {ruralComunas.length > 0 ? (
              <NativeSelectOptGroup label="Corregimientos">
                {ruralComunas.map((comuna) => (
                  <NativeSelectOption key={comuna.comuna_code} value={comuna.comuna_code}>
                    {comuna.name}
                  </NativeSelectOption>
                ))}
              </NativeSelectOptGroup>
            ) : null}
          </NativeSelect>
          <FieldError errors={fieldErrorList(state, "comunaCode")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Dirección aproximada (opcional)</FieldLabel>
          <Input
            id="address"
            name="address"
            type="text"
            maxLength={240}
            aria-invalid={Boolean(fieldErrorList(state, "address"))}
            className="min-h-12"
          />
          <FieldError errors={fieldErrorList(state, "address")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="affectedPeople">
            Personas afectadas (opcional)
          </FieldLabel>
          <Input
            id="affectedPeople"
            name="affectedPeople"
            type="number"
            min={0}
            max={100000}
            aria-invalid={Boolean(fieldErrorList(state, "affectedPeople"))}
            className="min-h-12"
          />
          <FieldError errors={fieldErrorList(state, "affectedPeople")} />
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
            aria-invalid={Boolean(fieldErrorList(state, "contactName"))}
            className="min-h-12"
          />
          <FieldError errors={fieldErrorList(state, "contactName")} />
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
            // Chromium validates the pattern attribute in Unicode-sets ("v"
            // flag) mode, which requires "(", ")", and a trailing "-" inside
            // a character class to be escaped even though they're literal.
            // String.raw avoids any ambiguity about how many backslashes a
            // plain string literal would need.
            pattern={String.raw`[0-9+\(\)#* \-]{7,25}`}
            aria-invalid={Boolean(fieldErrorList(state, "contactPhone"))}
            className="min-h-12"
          />
          <FieldError errors={fieldErrorList(state, "contactPhone")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="photo">Foto (opcional)</FieldLabel>
          <FieldDescription>
            Se elimina toda la información de ubicación de la foto antes de
            publicarla.
          </FieldDescription>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            aria-invalid={Boolean(fieldErrorList(state, "photo"))}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
          />
          <FieldError errors={fieldErrorList(state, "photo")} />
        </Field>

        <FieldSet>
          <FieldLegend>Autorizaciones</FieldLegend>
          <p className="text-sm text-muted-foreground">
            Lee el{" "}
            <Link
              href="/aviso-de-privacidad"
              target="_blank"
              className="underline underline-offset-4"
            >
              aviso de privacidad
            </Link>{" "}
            antes de autorizar.
          </p>

          <div className="flex items-start gap-2">
            <input
              id="dataProcessingConsent"
              name="dataProcessingConsent"
              type="checkbox"
              value="true"
              required
              className={CHECKBOX_CLASSNAME}
            />
            <Label htmlFor="dataProcessingConsent" className="text-sm leading-snug font-normal">
              Autorizo el tratamiento de mis datos personales para gestionar
              esta solicitud de ayuda, conforme a la Ley 1581 de 2012.
            </Label>
          </div>
          <FieldError errors={fieldErrorList(state, "dataProcessingConsent")} />

          <div className="flex items-start gap-2">
            <input
              id="publicPostingConsent"
              name="publicPostingConsent"
              type="checkbox"
              value="true"
              required
              className={CHECKBOX_CLASSNAME}
            />
            <Label htmlFor="publicPostingConsent" className="text-sm leading-snug font-normal">
              Autorizo que mi nombre, mi teléfono y mi foto se publiquen en el
              tablero público de necesidades.
            </Label>
          </div>
          <FieldError errors={fieldErrorList(state, "publicPostingConsent")} />
        </FieldSet>

        <SubmitButton />
      </FieldGroup>
    </form>
  );
}
