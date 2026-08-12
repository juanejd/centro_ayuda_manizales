"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { generateReferenceCode } from "@/modules/help-requests/domain/reference-code";
import {
  publishHelpRequestSchema,
  type HelpRequestCategory,
} from "@/modules/help-requests/domain/validation";
import {
  InvalidPhotoError,
  processHelpRequestPhoto,
} from "@/modules/help-requests/domain/photo-pipeline";
import { createServerSupabaseClient } from "@/shared/supabase/server";
import { createServiceRoleSupabaseClient } from "@/shared/supabase/service-role";

const PHOTO_BUCKET = "help-request-photos";
const RATE_LIMIT_SCOPE = "publish_help_request";
const RATE_LIMIT_MAX_HITS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const REFERENCE_CODE_MAX_ATTEMPTS = 5;
const UNIQUE_VIOLATION = "23505";

// Used only when no IP-bearing header is present at all — local dev without a
// reverse proxy in front of it. Never used to identify a real caller.
const LOCAL_DEV_IP_PLACEHOLDER = "local-dev-no-ip-header";

export type PublishHelpRequestResult =
  | { ok: true; referenceCode: string; manageToken: string }
  | { ok: false; fieldErrors: Record<string, string[]>; formError?: string };

function fail(
  fieldErrors: Record<string, string[]>,
  formError?: string,
): PublishHelpRequestResult {
  return { ok: false, fieldErrors, formError };
}

/**
 * Reads the caller's IP for rate limiting only — the raw value never reaches
 * the database. It is SHA-256 hashed before being used as check_rate_limit's
 * client_key.
 */
async function getHashedClientIp(): Promise<string> {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();

  const ip =
    firstForwarded || headerList.get("x-real-ip") || LOCAL_DEV_IP_PLACEHOLDER;

  return createHash("sha256").update(ip).digest("hex");
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = optionalString(value);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN; // let Zod reject NaN via its own type check
}

function readConsent(value: FormDataEntryValue | null): boolean {
  // Native checkbox semantics: present ("on", or any non-empty string) means
  // checked; absent means unchecked. Never defaults to true.
  return typeof value === "string" && value !== "" && value !== "false";
}

/**
 * Normalizes raw FormData into the plain object shape publishHelpRequestSchema
 * expects. Keeps the FormData-specific coercion here rather than inside the
 * shared schema, so the schema itself stays framework-agnostic and reusable
 * from a typed client form later (unit 4.5).
 */
function formDataToCandidate(formData: FormData) {
  return {
    category: optionalString(formData.get("category")),
    description: optionalString(formData.get("description")),
    sector: optionalString(formData.get("sector")),
    neighborhoodCode: optionalString(formData.get("neighborhoodCode")),
    comunaCode: optionalString(formData.get("comunaCode")),
    address: optionalString(formData.get("address")),
    latitude: optionalNumber(formData.get("latitude")),
    longitude: optionalNumber(formData.get("longitude")),
    affectedPeople: optionalNumber(formData.get("affectedPeople")),
    contactName: optionalString(formData.get("contactName")),
    contactPhone: optionalString(formData.get("contactPhone")),
    dataProcessingConsent: readConsent(formData.get("dataProcessingConsent")),
    publicPostingConsent: readConsent(formData.get("publicPostingConsent")),
  };
}

/**
 * RF-1.8: a supplied neighborhoodCode/comunaCode pair must be a real catalog
 * entry. The Zod schema only checks that both are present or both absent
 * (framework-agnostic, no DB access); this DB-backed cross-check is what
 * rejects a client bug/tamper case where the two don't actually correspond
 * to each other in the neighborhoods table. A legitimate unmatched barrio
 * never reaches this function at all — it never sends neighborhoodCode.
 */
async function verifyNeighborhoodComunaPair(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  neighborhoodCode: string | undefined,
  comunaCode: string | undefined,
): Promise<string | null> {
  if (!neighborhoodCode || !comunaCode) {
    return null;
  }

  const { data, error } = await supabase
    .from("neighborhoods")
    .select("comuna_code")
    .eq("neighborhood_code", neighborhoodCode)
    .maybeSingle();

  if (error) {
    return "No se pudo verificar el barrio.";
  }

  if (!data || data.comuna_code !== comunaCode) {
    return "El barrio y la comuna indicados no corresponden entre sí.";
  }

  return null;
}

async function deleteUploadedPhoto(path: string): Promise<void> {
  const serviceRoleClient = createServiceRoleSupabaseClient();
  await serviceRoleClient.storage.from(PHOTO_BUCKET).remove([path]);
}

export async function publishHelpRequest(
  formData: FormData,
): Promise<PublishHelpRequestResult> {
  const candidate = formDataToCandidate(formData);
  const parsed = publishHelpRequestSchema.safeParse(candidate);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return fail(fieldErrors);
  }

  const input = parsed.data;

  const anonClient = createServerSupabaseClient();

  const neighborhoodMismatch = await verifyNeighborhoodComunaPair(
    anonClient,
    input.neighborhoodCode,
    input.comunaCode,
  );
  if (neighborhoodMismatch) {
    return fail({ neighborhoodCode: [neighborhoodMismatch] });
  }

  // RF-4.5: 5 submissions per 10 minutes per IP. The RPC call itself both
  // checks AND records this attempt (see check_rate_limit in the migration),
  // so this must run exactly once per submission, not once per retry below.
  const hashedIp = await getHashedClientIp();
  const { data: allowed, error: rateLimitError } = await anonClient.rpc(
    "check_rate_limit",
    {
      p_scope: RATE_LIMIT_SCOPE,
      p_client_key: hashedIp,
      p_max_hits: RATE_LIMIT_MAX_HITS,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    },
  );

  if (rateLimitError) {
    return fail({}, "No se pudo procesar la publicación. Intenta de nuevo.");
  }

  if (allowed === false) {
    return fail(
      {},
      "Demasiados intentos. Espera unos minutos antes de volver a intentar.",
    );
  }

  // Photo upload happens BEFORE the row insert (the "no orphan" ordering):
  // if the insert ultimately fails, the uploaded object is deleted below
  // rather than left dangling. If the insert succeeds, both exist together.
  let photoPath: string | undefined;
  const photoFile = formData.get("photo");

  if (photoFile instanceof File && photoFile.size > 0) {
    let processed: Buffer;
    try {
      const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
      processed = await processHelpRequestPhoto(inputBuffer);
    } catch (error) {
      if (error instanceof InvalidPhotoError) {
        return fail({ photo: [error.message] });
      }
      return fail({ photo: ["No se pudo procesar la foto."] });
    }

    const path = `${randomUUID()}.jpg`;
    const serviceRoleClient = createServiceRoleSupabaseClient();
    const { error: uploadError } = await serviceRoleClient.storage
      .from(PHOTO_BUCKET)
      .upload(path, processed, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return fail({ photo: ["No se pudo guardar la foto."] });
    }

    photoPath = path;
  }

  const nowIso = new Date().toISOString();
  // Generated here, not read back after insert: anon has no SELECT grant on
  // help_requests (see supabase/migrations/*_allow_anon_insert_manage_token.sql),
  // so `.insert().select()` would fail with "permission denied for table
  // help_requests" — RETURNING requires SELECT privilege, which this table
  // deliberately never grants to anon. Same UUIDv4 entropy as the column's
  // gen_random_uuid() default.
  const manageToken = randomUUID();

  let attempt = 0;
  let lastError: { code?: string; message: string } | null = null;

  while (attempt < REFERENCE_CODE_MAX_ATTEMPTS) {
    attempt += 1;
    const referenceCode = generateReferenceCode();

    const { error } = await anonClient.from("help_requests").insert({
      reference_code: referenceCode,
      manage_token: manageToken,
      category: input.category satisfies HelpRequestCategory,
      description: input.description,
      sector: input.sector,
      neighborhood_code: input.neighborhoodCode ?? null,
      comuna_code: input.comunaCode ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      affected_people: input.affectedPeople ?? null,
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      photo_path: photoPath ?? null,
      consent_accepted_at: nowIso,
      public_consent_at: nowIso,
    });

    if (!error) {
      return { ok: true, referenceCode, manageToken };
    }

    lastError = error
      ? { code: (error as { code?: string }).code, message: error.message }
      : { message: "Unknown insert error" };

    const isReferenceCodeCollision =
      lastError.code === UNIQUE_VIOLATION &&
      lastError.message.includes("reference_code");

    if (!isReferenceCodeCollision) {
      break;
    }
    // Otherwise: loop again with a freshly generated reference code.
  }

  // Insert never succeeded: clean up the orphaned photo, if any, before
  // returning — never a photo without its request.
  if (photoPath) {
    await deleteUploadedPhoto(photoPath);
  }

  if (
    lastError?.code === UNIQUE_VIOLATION &&
    lastError.message.includes("reference_code")
  ) {
    throw new Error(
      `Could not generate a unique reference code after ${REFERENCE_CODE_MAX_ATTEMPTS} attempts.`,
    );
  }

  return fail(
    {},
    "No se pudo publicar la necesidad. Intenta de nuevo en unos minutos.",
  );
}
