import { z } from "zod";

export const RESOURCE_CATEGORIES = [
  "albergues",
  "hospitales",
  "centros_medicos",
  "donacion_sangre",
  "puntos_donacion",
  "centros_acopio",
  "atencion_mascotas",
  "personas_desaparecidas",
  "evaluacion_viviendas",
  "servicios_publicos",
  "bomberos",
  "defensa_civil",
  "cruz_roja",
  "alcaldias",
  "gobernacion",
  "lineas_atencion",
  "cierres_viales",
  "otros",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  albergues: "Albergues",
  hospitales: "Hospitales",
  centros_medicos: "Centros médicos",
  lineas_atencion: "Líneas de atención",
  bomberos: "Bomberos",
  defensa_civil: "Defensa Civil",
  cruz_roja: "Cruz Roja",
  donacion_sangre: "Donación de sangre",
  centros_acopio: "Centros de acopio",
  puntos_donacion: "Puntos de donación",
  atencion_mascotas: "Atención a mascotas",
  personas_desaparecidas: "Personas desaparecidas",
  evaluacion_viviendas: "Evaluación de viviendas",
  servicios_publicos: "Servicios públicos",
  cierres_viales: "Cierres viales",
  alcaldias: "Alcaldía",
  gobernacion: "Gobernación",
  otros: "Otros",
};

export const RESOURCE_STATUSES = [
  "verificado",
  "pendiente",
  "desactualizado",
  "cerrado",
] as const;

export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export function isResourceCategory(value: unknown): value is ResourceCategory {
  return (
    typeof value === "string" &&
    (RESOURCE_CATEGORIES as readonly string[]).includes(value)
  );
}

export const UNCONFIRMED_INFO_SENTENCE =
  "No se encontró información oficial confirmada hasta la última verificación";

export const FRESHNESS_THRESHOLD_HOURS = 72;

const HOUR_IN_MS = 60 * 60 * 1000;

export type FreshnessLevel = "confirmed" | "aging" | "unconfirmed" | "closed";

export type Freshness = {
  level: FreshnessLevel;
  label: string;
  age: string | null;
  advice: string | null;
};

export function formatAge(from: Date, now: Date): string {
  const elapsedMs = Math.max(0, now.getTime() - from.getTime());
  const minutes = Math.floor(elapsedMs / 60000);

  if (minutes < 60) {
    return minutes <= 1 ? "hace unos minutos" : `hace ${minutes} minutos`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "hace 1 hora" : `hace ${hours} horas`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return days === 1 ? "hace 1 día" : `hace ${days} días`;
  }

  const months = Math.floor(days / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}

export function resolveFreshness(
  resource: {
    status: ResourceStatus;
    verified_at: string | null;

    source?: string | null;
  },
  now: Date,
): Freshness {
  if (resource.status === "cerrado") {
    return {
      level: "closed",
      label: "Cerrado",
      age: resource.verified_at
        ? formatAge(new Date(resource.verified_at), now)
        : null,
      advice: "Este lugar ya no está recibiendo personas.",
    };
  }

  if (resource.status === "verificado" && resource.verified_at) {
    const verifiedAt = new Date(resource.verified_at);
    const age = formatAge(verifiedAt, now);
    const elapsedHours = (now.getTime() - verifiedAt.getTime()) / HOUR_IN_MS;

    if (elapsedHours <= FRESHNESS_THRESHOLD_HOURS) {
      return {
        level: "confirmed",
        label: "Confirmado",
        age,
        advice: null,
      };
    }

    return {
      level: "aging",
      label: "Confirmado hace días",
      age,
      advice: "Llama antes de ir: puede haber cambiado.",
    };
  }

  if (resource.status === "desactualizado") {
    return {
      level: "aging",
      label: "Desactualizado",
      age: resource.verified_at
        ? formatAge(new Date(resource.verified_at), now)
        : null,
      advice: "Llama antes de ir: puede haber cambiado.",
    };
  }

  if (
    resource.status === "pendiente" &&
    resource.verified_at &&
    resource.source
  ) {
    return {
      level: "unconfirmed",
      label: "En verificación",
      age: formatAge(new Date(resource.verified_at), now),
      advice:
        "Una fuente oficial reportó estos datos; su estado actual sigue en verificación.",
    };
  }

  return {
    level: "unconfirmed",
    label: "Sin confirmar",
    age: null,
    advice: "Nadie ha confirmado estos datos todavía.",
  };
}

export function toDialable(phone: string): string {
  const leadingSequence = phone.match(/^[+#*\d][\d\s().+#*-]*/);

  if (!leadingSequence) {
    return "";
  }

  return leadingSequence[0].replace(/[\s().-]/g, "");
}

export function toTelHref(phone: string): string {
  return `tel:${toDialable(phone).replace(/#/g, "%23")}`;
}

export function isDialable(phone: string): boolean {
  return toDialable(phone).length > 0;
}

const COLOMBIA_COUNTRY_CODE = "57";

/**
 * wa.me needs plain digits, no "+"/"#"/"*"/spaces — unlike toTelHref, which
 * keeps those because tel: URLs support them. Phones are collected from
 * citizens as local Colombian numbers (no country code); this platform is
 * Manizales-only, so prepending 57 when it's missing is a safe assumption
 * here, not a general-purpose phone formatter.
 */
export function toWhatsAppHref(phone: string, message: string): string {
  const digits = toDialable(phone).replace(/\D/g, "");
  const withCountryCode = digits.startsWith(COLOMBIA_COUNTRY_CODE)
    ? digits
    : `${COLOMBIA_COUNTRY_CODE}${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

export const PRIORITY_EMERGENCY_LINES = [
  { phone: "123", label: "Emergencias" },
  { phone: "123 opción 2", label: "Urgencias médicas" },
  { phone: "119", label: "Bomberos y rescate" },
] as const;

export type PriorityEmergencyLine = (typeof PRIORITY_EMERGENCY_LINES)[number];

export function normalizePhoneText(phone: string): string {
  return phone.trim().toLowerCase().replace(/\s+/g, " ");
}

// =============================================================================
// Unit 6.5/6.7 — Zod schemas for the staff-only create/edit forms.
//
// Framework-agnostic, like help-requests/domain/validation.ts's schema: no
// server-only import, operates on an already-normalized plain object. The
// FormData -> candidate coercion (splitting the phones textarea, etc.) is the
// Server Action's job, not this module's — see
// src/modules/moderation/actions/resources.ts.
// =============================================================================

// Mirrors the CHECK constraint on info_resources.slug.
export const RESOURCE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isValidDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function requireNeighborhoodComunaTogether(
  value: { neighborhoodCode?: string; comunaCode?: string },
  ctx: z.RefinementCtx,
): void {
  const hasNeighborhood = value.neighborhoodCode !== undefined;
  const hasComuna = value.comunaCode !== undefined;

  if (hasNeighborhood !== hasComuna) {
    ctx.addIssue({
      code: "custom",
      path: [hasNeighborhood ? "comunaCode" : "neighborhoodCode"],
      message:
        "neighborhoodCode and comunaCode must be supplied together, or not at all",
    });
  }
}

/**
 * RI-1/RI-2/RI-6 and the info_resources_verified_complete DB constraint
 * (see supabase/migrations/20260812120000_moderation_institutional_content.sql):
 * marking a resource 'verificado' without both a source and a verification
 * date is rejected here first, for a clean redirect instead of a raw
 * Postgres error reaching the moderator — the same shape as
 * help_requests_verified_complete / verifyHelpRequest in moderate.ts.
 */
function requireSourceAndDateWhenVerified(
  value: { status: ResourceStatus; source?: string; verifiedAt?: string },
  ctx: z.RefinementCtx,
): void {
  if (value.status !== "verificado") {
    return;
  }

  if (!value.source) {
    ctx.addIssue({
      code: "custom",
      path: ["source"],
      message:
        "La fuente es obligatoria para marcar un recurso como verificado.",
    });
  }

  if (!value.verifiedAt) {
    ctx.addIssue({
      code: "custom",
      path: ["verifiedAt"],
      message:
        "La fecha de verificación es obligatoria para marcar un recurso como verificado.",
    });
  }
}

const resourceFieldsSchema = z.object({
  category: z.enum(RESOURCE_CATEGORIES),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  address: z.string().trim().max(240).optional(),
  neighborhoodCode: z.string().trim().min(1).max(80).optional(),
  comunaCode: z.string().trim().min(1).max(60).optional(),
  meetingPoint: z.string().trim().max(400).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phones: z.array(z.string().trim().min(1).max(60)).max(10),
  hours: z.string().trim().max(240).optional(),
  source: z.string().trim().max(200).optional(),
  status: z.enum(RESOURCE_STATUSES),
  verifiedAt: z
    .string()
    .trim()
    .min(1)
    .refine(isValidDateString, "Fecha de verificación inválida.")
    .optional(),
});

export const createResourceSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(140)
      .regex(
        RESOURCE_SLUG_PATTERN,
        "Usa minúsculas, números y guiones, sin espacios (ej. mi-recurso).",
      ),
  })
  .extend(resourceFieldsSchema.shape)
  .superRefine((value, ctx) => {
    requireNeighborhoodComunaTogether(value, ctx);
    requireSourceAndDateWhenVerified(value, ctx);
  });

export const editResourceSchema = resourceFieldsSchema.superRefine(
  (value, ctx) => {
    requireNeighborhoodComunaTogether(value, ctx);
    requireSourceAndDateWhenVerified(value, ctx);
  },
);

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type EditResourceInput = z.infer<typeof editResourceSchema>;

// Unit 6.6: "no se puede guardar una foto sin texto alternativo" — enforced
// here, before any upload happens, not just at the (nullable) DB column.
export const resourcePhotoSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(1, "El texto alternativo es obligatorio.")
    .max(300),
});

// Unit 6.7 — mirrors the alerts table's CHECK constraints.
export const alertFieldsSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(4000),
  source: z.string().trim().min(1).max(200),
  expiresAt: z
    .string()
    .trim()
    .min(1)
    .refine(isValidDateString, "Fecha de vencimiento inválida.")
    .optional(),
});

export type AlertFieldsInput = z.infer<typeof alertFieldsSchema>;
