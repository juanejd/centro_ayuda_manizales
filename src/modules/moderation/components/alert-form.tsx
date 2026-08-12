import {
  createAlert,
  updateAlert,
} from "@/modules/moderation/actions/alerts";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

// Same visual tokens as src/shared/ui/input.tsx — see resource-form.tsx's
// own copy of the same comment; there is no shared <Textarea> yet.
const TEXTAREA_CLASSNAME = cn(
  "min-h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
);

export type AlertFormValues = {
  alertId?: number;
  title: string;
  description: string;
  source: string;
  expiresAt: string;
};

export const EMPTY_ALERT_FORM_VALUES: AlertFormValues = {
  title: "",
  description: "",
  source: "",
  expiresAt: "",
};

/**
 * RF-6.9 / unit 6.7. One component behind /moderacion/alertas/nueva and
 * /moderacion/alertas/[id] — only the hidden alertId field and the target
 * Server Action differ between create and edit.
 */
export function AlertForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values: AlertFormValues;
}) {
  const action = mode === "create" ? createAlert : updateAlert;

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      {mode === "edit" ? (
        <input type="hidden" name="alertId" value={values.alertId} />
      ) : null}

      <Field>
        <FieldLabel htmlFor="title">Título</FieldLabel>
        <Input
          id="title"
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={200}
          defaultValue={values.title}
          className="min-h-12"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Descripción</FieldLabel>
        <textarea
          id="description"
          name="description"
          required
          minLength={2}
          maxLength={4000}
          rows={4}
          defaultValue={values.description}
          className={TEXTAREA_CLASSNAME}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="source">Fuente</FieldLabel>
        <FieldDescription>
          Obligatoria: una alerta sin fuente no es verificable.
        </FieldDescription>
        <Input
          id="source"
          name="source"
          type="text"
          required
          maxLength={200}
          placeholder="Ej. Comunicado oficial de la Alcaldía de Manizales"
          defaultValue={values.source}
          className="min-h-12"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="expiresAt">
          Fecha de vencimiento (opcional)
        </FieldLabel>
        <FieldDescription>
          Vacío significa que la alerta no vence sola; usa &quot;Vencer&quot;
          en cualquier momento para retirarla de inmediato.
        </FieldDescription>
        <Input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          defaultValue={values.expiresAt}
          className="min-h-12"
        />
      </Field>

      <Button type="submit" className="min-h-12 w-fit px-6">
        {mode === "create" ? "Crear alerta" : "Guardar cambios"}
      </Button>
    </form>
  );
}
