import {
  CATEGORY_LABELS,
  RESOURCE_CATEGORIES,
  RESOURCE_STATUSES,
  type ResourceCategory,
  type ResourceStatus,
} from "@/modules/info-resources/domain";
import {
  createInfoResource,
  updateInfoResource,
} from "@/modules/moderation/actions/resources";
import type { ComunaOption } from "@/modules/help-requests/queries";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";

// Same visual tokens as src/shared/ui/input.tsx, reused by hand as every
// other multi-line field in this codebase does (see publish-form.tsx) —
// there is no shared <Textarea> component in src/shared/ui yet.
const TEXTAREA_CLASSNAME = cn(
  "min-h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
);

const STATUS_LABELS: Record<ResourceStatus, string> = {
  verificado: "Verificado",
  pendiente: "Pendiente",
  desactualizado: "Desactualizado",
  cerrado: "Cerrado",
};

export type ResourceFormValues = {
  slug: string;
  category: ResourceCategory | "";
  name: string;
  description: string;
  address: string;
  neighborhoodCode: string;
  comunaCode: string;
  meetingPoint: string;
  latitude: string;
  longitude: string;
  phones: string;
  hours: string;
  source: string;
  status: ResourceStatus;
  verifiedAt: string;
};

export const EMPTY_RESOURCE_FORM_VALUES: ResourceFormValues = {
  slug: "",
  category: "",
  name: "",
  description: "",
  address: "",
  neighborhoodCode: "",
  comunaCode: "",
  meetingPoint: "",
  latitude: "",
  longitude: "",
  phones: "",
  hours: "",
  source: "",
  status: "pendiente",
  verifiedAt: "",
};

/**
 * RF-6.5. One component behind both /moderacion/recursos/nuevo and
 * /moderacion/recursos/[slug], per the phase doc's own suggestion — the
 * only structural difference is the slug field (editable only on create,
 * per the domain schema's own createResourceSchema/editResourceSchema
 * split) and which Server Action the form posts to.
 */
export function ResourceForm({
  mode,
  values,
  comunas,
}: {
  mode: "create" | "edit";
  values: ResourceFormValues;
  comunas: ComunaOption[];
}) {
  const action = mode === "create" ? createInfoResource : updateInfoResource;
  const urbanComunas = comunas.filter((comuna) => comuna.kind === "urbana");
  const ruralComunas = comunas.filter((comuna) => comuna.kind === "rural");

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      {mode === "edit" ? (
        <input type="hidden" name="slug" value={values.slug} />
      ) : (
        <Field>
          <FieldLabel htmlFor="slug">Identificador (slug)</FieldLabel>
          <FieldDescription>
            Minúsculas, números y guiones (ej. albergue-la-enea). No se puede
            cambiar después de crear el recurso.
          </FieldDescription>
          <Input
            id="slug"
            name="slug"
            type="text"
            required
            maxLength={140}
            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            defaultValue={values.slug}
            className="min-h-12"
          />
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="category">Categoría</FieldLabel>
        <NativeSelect
          id="category"
          name="category"
          required
          defaultValue={values.category}
          className="min-h-12 w-full"
        >
          <NativeSelectOption value="" disabled hidden>
            Selecciona una categoría
          </NativeSelectOption>
          {RESOURCE_CATEGORIES.map((category) => (
            <NativeSelectOption key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor="name">Nombre</FieldLabel>
        <Input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={200}
          defaultValue={values.name}
          className="min-h-12"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Descripción</FieldLabel>
        <textarea
          id="description"
          name="description"
          maxLength={4000}
          rows={4}
          defaultValue={values.description}
          className={TEXTAREA_CLASSNAME}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="address">Dirección</FieldLabel>
        <Input
          id="address"
          name="address"
          type="text"
          maxLength={240}
          defaultValue={values.address}
          className="min-h-12"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="comunaCode">Comuna</FieldLabel>
          <NativeSelect
            id="comunaCode"
            name="comunaCode"
            defaultValue={values.comunaCode}
            className="min-h-12 w-full"
          >
            <NativeSelectOption value="">Sin asignar</NativeSelectOption>
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
          <FieldLabel htmlFor="neighborhoodCode">
            Código de barrio (opcional)
          </FieldLabel>
          <Input
            id="neighborhoodCode"
            name="neighborhoodCode"
            type="text"
            maxLength={80}
            defaultValue={values.neighborhoodCode}
            className="min-h-12"
          />
          <FieldDescription>
            Debe existir en el catálogo y corresponder a la comuna elegida.
            Déjalo vacío si solo conoces la comuna.
          </FieldDescription>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="meetingPoint">
          Punto de encuentro (opcional)
        </FieldLabel>
        <Input
          id="meetingPoint"
          name="meetingPoint"
          type="text"
          maxLength={400}
          defaultValue={values.meetingPoint}
          className="min-h-12"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="latitude">Latitud (opcional)</FieldLabel>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            defaultValue={values.latitude}
            className="min-h-12"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="longitude">Longitud (opcional)</FieldLabel>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            defaultValue={values.longitude}
            className="min-h-12"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="phones">Teléfonos (opcional)</FieldLabel>
        <FieldDescription>
          Uno por línea o separados por coma. Máximo 10.
        </FieldDescription>
        <textarea
          id="phones"
          name="phones"
          rows={2}
          defaultValue={values.phones}
          className={TEXTAREA_CLASSNAME}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="hours">Horario (opcional)</FieldLabel>
        <Input
          id="hours"
          name="hours"
          type="text"
          maxLength={240}
          defaultValue={values.hours}
          className="min-h-12"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="status">Estado</FieldLabel>
        <FieldDescription>
          RI-1/RI-2: no marques un albergue como habilitado ni un hospital
          como cerrado sin una confirmación oficial concreta. &quot;Presenta
          afectaciones&quot; no equivale a &quot;cerrado&quot;.
        </FieldDescription>
        <NativeSelect
          id="status"
          name="status"
          required
          defaultValue={values.status}
          className="min-h-12 w-full"
        >
          {RESOURCE_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor="source">Fuente</FieldLabel>
        <FieldDescription>
          Obligatoria para marcar el recurso como verificado (RI-6).
        </FieldDescription>
        <Input
          id="source"
          name="source"
          type="text"
          maxLength={200}
          defaultValue={values.source}
          placeholder="Ej. Alcaldía de Manizales, comunicado del 12/08"
          className="min-h-12"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="verifiedAt">
          Fecha de verificación
        </FieldLabel>
        <FieldDescription>
          Obligatoria, junto con la fuente, para marcar el recurso como
          verificado.
        </FieldDescription>
        <Input
          id="verifiedAt"
          name="verifiedAt"
          type="datetime-local"
          defaultValue={values.verifiedAt}
          className="min-h-12"
        />
      </Field>

      <Button type="submit" className="min-h-12 w-fit px-6">
        {mode === "create" ? "Crear recurso" : "Guardar cambios"}
      </Button>
    </form>
  );
}
