import { z } from "zod";

// Mirrors the CHECK constraint on help_requests.category in
// supabase/migrations/20260811072658_initial_schema.sql. Keep both lists in
// lockstep — this one is the client/server validation copy, the CHECK is the
// database's own copy.
export const HELP_REQUEST_CATEGORIES = [
  "salud",
  "vivienda",
  "albergue",
  "alimentos",
  "agua",
  "sangre",
  "mascotas",
  "movilidad",
  "servicios_publicos",
  "personas_desaparecidas",
  "atencion_psicologica",
  "transporte",
  "remocion_escombros",
  "otros",
] as const;

export type HelpRequestCategory = (typeof HELP_REQUEST_CATEGORIES)[number];

export function isHelpRequestCategory(
  value: unknown,
): value is HelpRequestCategory {
  return (
    typeof value === "string" &&
    (HELP_REQUEST_CATEGORIES as readonly string[]).includes(value)
  );
}

// public_help_requests can only ever surface the first 3 to anon (its WHERE
// clause excludes 'oculta' and 'retirada'); the manage page (unit 4.9) reads
// the base table via service_role and can see all 5.
export type ModerationStatus =
  | "sin_verificar"
  | "verificado"
  | "duplicado"
  | "oculta"
  | "retirada";

export const MODERATION_BADGE: Record<
  ModerationStatus,
  { label: string; className: string }
> = {
  sin_verificar: {
    label: "Sin verificar",
    className: "bg-stale-surface text-stale-foreground",
  },
  verificado: {
    label: "Verificado",
    className: "bg-verified-surface text-verified-foreground",
  },
  duplicado: {
    label: "Posible duplicado",
    className: "bg-closed-surface text-closed-foreground",
  },
  oculta: {
    label: "Oculta por moderación",
    className: "bg-closed-surface text-closed-foreground",
  },
  retirada: {
    label: "Retirada",
    className: "bg-closed-surface text-closed-foreground",
  },
};

// RF-1.13: never computed automatically — a request is born without one,
// only a Moderator (fase 6) assigns it.
export const PRIORITY_LEVELS = ["critico", "alto", "medio", "bajo"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export function isPriorityLevel(value: unknown): value is PriorityLevel {
  return (
    typeof value === "string" &&
    (PRIORITY_LEVELS as readonly string[]).includes(value)
  );
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

export const CATEGORY_LABELS: Record<HelpRequestCategory, string> = {
  salud: "Salud",
  vivienda: "Vivienda",
  albergue: "Albergue",
  alimentos: "Alimentos",
  agua: "Agua",
  sangre: "Sangre",
  mascotas: "Mascotas",
  movilidad: "Movilidad",
  servicios_publicos: "Servicios públicos",
  personas_desaparecidas: "Personas desaparecidas",
  atencion_psicologica: "Atención psicológica",
  transporte: "Transporte",
  remocion_escombros: "Remoción de escombros",
  otros: "Otros",
};

// Same character class as help_requests.contact_phone's CHECK: permissive on
// purpose, only length and character class, never a strict "valid phone
// number" pattern that could reject a real number typed during an emergency.
const CONTACT_PHONE_PATTERN = /^[0-9+()#* -]{7,25}$/;

/**
 * Framework-agnostic. No server-only imports here: this schema is meant to be
 * imported both by a future client form (unit 4.5, not built in this PR) and
 * by the publish Server Action (unit 4.4) in this PR.
 *
 * Operates on a plain, already-normalized object — not on FormData directly.
 * Extracting/coercing FormData string values (numbers, checkbox booleans)
 * into this shape is the caller's job (see src/modules/help-requests/actions/publish.ts).
 *
 * neighborhoodCode/comunaCode: RF-1.8 — the person always types free text
 * into `sector`. neighborhoodCode/comunaCode are only set when that text was
 * matched against the neighborhoods catalog by a client-side autocomplete
 * (unit 4.5). A legitimate unmatched barrio sends neither field, so this
 * schema only enforces that the pair is supplied together, or not at all —
 * it does NOT know whether a supplied pair is a real catalog entry. That
 * cross-check (does this neighborhoodCode really belong to this comunaCode?)
 * requires a database lookup and is performed by the Server Action, not here.
 */
// Split from the exported schema so unit 4.9's correction form can .pick()
// a subset of the same field rules without inheriting the superRefine below
// (which reasons about neighborhoodCode/comunaCode, fields correction
// deliberately doesn't touch) or the publish-only consent fields.
const helpRequestFields = z.object({
  category: z.enum(HELP_REQUEST_CATEGORIES),

  description: z.string().trim().min(10).max(2000),

  sector: z.string().trim().min(2).max(160),

  neighborhoodCode: z.string().trim().min(1).max(80).optional(),
  comunaCode: z.string().trim().min(1).max(60).optional(),

  address: z.string().trim().max(240).optional(),

  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  affectedPeople: z.int().min(0).max(100000).optional(),

  contactName: z.string().trim().min(2).max(160),
  contactPhone: z.string().trim().regex(CONTACT_PHONE_PATTERN),

  // RF-1.6: two SEPARATE consents, Ley 1581 requires informed authorization
  // per distinct purpose. Both must be exactly `true` — `false`, missing,
  // or any other value is rejected.
  dataProcessingConsent: z.literal(true),
  publicPostingConsent: z.literal(true),
});

export const publishHelpRequestSchema = helpRequestFields.superRefine(
  (value, ctx) => {
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
  },
);

export type PublishHelpRequestInput = z.infer<typeof publishHelpRequestSchema>;

// Unit 4.9 ("corregir"): the same rules as the matching publish fields,
// deliberately excluding geography/consent/photo — correction only ever
// touches the fields a person can misdescribe in the moment (what, where in
// free text, how to reach them).
export const helpRequestCorrectionSchema = helpRequestFields.pick({
  category: true,
  description: true,
  sector: true,
  contactName: true,
  contactPhone: true,
});

export type HelpRequestCorrectionInput = z.infer<
  typeof helpRequestCorrectionSchema
>;
