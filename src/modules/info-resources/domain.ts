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

export const PRIORITY_EMERGENCY_LINES = [
  { phone: "123", label: "Emergencias" },
  { phone: "123 opción 2", label: "Urgencias médicas" },
  { phone: "119", label: "Bomberos y rescate" },
] as const;

export type PriorityEmergencyLine = (typeof PRIORITY_EMERGENCY_LINES)[number];

export function normalizePhoneText(phone: string): string {
  return phone.trim().toLowerCase().replace(/\s+/g, " ");
}
