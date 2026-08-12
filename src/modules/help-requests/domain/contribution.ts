import type { HelpRequestCategory } from "@/modules/help-requests/domain/validation";

// TRD §9 — the two vocabularies don't line up: whoever is helping thinks in
// what they HAVE (a truck, food, a chainsaw); whoever needs help writes what
// they're MISSING (transporte, alimentos, remoción de escombros). This table
// is the only bridge between them, lives in code (not a DB table), and is
// reviewed in a diff, not edited in production.
export const CONTRIBUTION_TYPES = [
  "alimentos",
  "agua",
  "ropa_cobijas",
  "medicamentos",
  "alojamiento",
  "alimento_mascotas",
  "transporte",
  "vehiculos",
  "maquinaria",
  "herramientas",
  "servicios_profesionales",
  "tiempo_voluntario",
  "otro",
  "dinero",
] as const;

export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export function isContributionType(value: unknown): value is ContributionType {
  return (
    typeof value === "string" &&
    (CONTRIBUTION_TYPES as readonly string[]).includes(value)
  );
}

export const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  alimentos: "Alimentos",
  agua: "Agua",
  ropa_cobijas: "Ropa y cobijas",
  medicamentos: "Medicamentos o insumos permitidos",
  alojamiento: "Alojamiento",
  alimento_mascotas: "Alimento para mascotas",
  transporte: "Transporte",
  vehiculos: "Vehículos",
  maquinaria: "Maquinaria",
  herramientas: "Herramientas",
  servicios_profesionales: "Servicios profesionales",
  tiempo_voluntario: "Tiempo como voluntario",
  otro: "Otro",
  dinero: "Dinero",
};

// "all" (tiempo_voluntario, otro): the contribution fits any need, so the
// filter is a no-op — same as no category selected on the board.
// "none" (dinero): the platform never touches money, so this type never
// reaches the board query at all; the page short-circuits before it does.
export type ContributionCategoryMapping =
  | readonly HelpRequestCategory[]
  | "all"
  | "none";

// Sangre and personas_desaparecidas are deliberately absent from every row:
// TRD §9 — they're resolved by showing up at a collection point or
// reporting information, not by someone contributing a resource. They must
// appear on the board (fase 4) and never as a filter destination here.
export const CONTRIBUTION_CATEGORIES: Record<
  ContributionType,
  ContributionCategoryMapping
> = {
  alimentos: ["alimentos"],
  agua: ["agua"],
  ropa_cobijas: ["albergue", "vivienda"],
  medicamentos: ["salud"],
  alojamiento: ["albergue", "vivienda"],
  alimento_mascotas: ["mascotas"],
  transporte: ["transporte", "movilidad", "salud"],
  vehiculos: ["transporte", "movilidad", "remocion_escombros"],
  maquinaria: ["remocion_escombros", "movilidad"],
  herramientas: ["remocion_escombros", "vivienda"],
  // Deliberately broad: an engineer, a vet, and a psychologist all pick this
  // same row. Narrowing it needs a profession sub-field, which adds friction
  // against RP-1 — see TRD §9's own note.
  servicios_profesionales: [
    "salud",
    "vivienda",
    "atencion_psicologica",
    "servicios_publicos",
    "mascotas",
  ],
  tiempo_voluntario: "all",
  otro: "all",
  dinero: "none",
};
