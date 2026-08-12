"use server";

import { redirect } from "next/navigation";

import { isPriorityLevel } from "@/modules/help-requests/domain/validation";
import { getCurrentStaffSession } from "@/modules/moderation/queries";
import { createAuthServerClient } from "@/shared/supabase/auth-server";
import { createServiceRoleSupabaseClient } from "@/shared/supabase/service-role";

const PHOTO_BUCKET = "help-request-photos";

type ModerationLogAction =
  | "verify"
  | "hide"
  | "withdraw"
  | "mark_duplicate"
  | "set_priority"
  | "update";

/**
 * Every action below re-derives the staff session instead of trusting the
 * caller: a Server Action is a public HTTP endpoint by construction, not
 * gated by the (protected) layout that only guards page renders. RLS
 * (private.is_staff()) is the real backstop underneath this — this check
 * just turns an RLS rejection into a clean redirect instead of a raw
 * Postgres error reaching the moderator.
 */
async function requireStaffSession() {
  const session = await getCurrentStaffSession();
  if (!session?.role) {
    redirect("/moderacion/login");
  }
  return session;
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function logModeration(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  action: ModerationLogAction,
  entityId: number,
  actorUserId: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  await supabase.from("moderation_log").insert({
    entity_type: "help_request",
    entity_id: entityId,
    action,
    actor: actorUserId,
    payload: payload ?? null,
  });
}

/**
 * Retirada is terminal (matches unit 4.9's own rule for the citizen path):
 * once withdrawn, redirects with an error instead of applying any further
 * moderation action. Without this, a stale page (opened before someone
 * else — staff or the citizen via 4.9 — withdrew it) could still hide,
 * verify, or reprioritize a post that's already gone.
 */
async function requireMutableRequest(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  code: string,
): Promise<number> {
  const { data } = await supabase
    .from("help_requests")
    .select("request_id, moderation_status")
    .eq("reference_code", code)
    .maybeSingle();

  if (!data) redirect("/moderacion");
  if (data.moderation_status === "retirada") {
    redirect(`/moderacion/${code}?error=ya_retirada`);
  }

  return data.request_id;
}

async function findRequestId(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  code: string,
): Promise<number | null> {
  const { data } = await supabase
    .from("help_requests")
    .select("request_id")
    .eq("reference_code", code)
    .maybeSingle();
  return data?.request_id ?? null;
}

export async function verifyHelpRequest(formData: FormData): Promise<void> {
  const session = await requireStaffSession();
  const code = formValue(formData, "code");
  const source = formValue(formData, "source");

  if (!code) redirect("/moderacion");

  // The DB's help_requests_verified_complete CHECK constraint rejects this
  // same case at the SQL level — this early return just avoids sending a
  // request that would fail there, for a faster/cleaner redirect.
  if (!source) {
    redirect(`/moderacion/${code}?error=fuente_requerida`);
  }

  const supabase = await createAuthServerClient();
  const requestId = await requireMutableRequest(supabase, code);

  const { error } = await supabase
    .from("help_requests")
    .update({
      moderation_status: "verificado",
      verified_at: new Date().toISOString(),
      verified_source: source,
    })
    .eq("request_id", requestId);

  if (error) {
    redirect(`/moderacion/${code}?error=verificar`);
  }

  await logModeration(supabase, "verify", requestId, session.userId, { source });
  redirect(`/moderacion/${code}?ok=verificado`);
}

export async function hideHelpRequest(formData: FormData): Promise<void> {
  const session = await requireStaffSession();
  const code = formValue(formData, "code");
  if (!code) redirect("/moderacion");

  const supabase = await createAuthServerClient();
  const requestId = await requireMutableRequest(supabase, code);

  const { error } = await supabase
    .from("help_requests")
    .update({ moderation_status: "oculta" })
    .eq("request_id", requestId);

  if (error) redirect(`/moderacion/${code}?error=ocultar`);

  await logModeration(supabase, "hide", requestId, session.userId);
  redirect(`/moderacion/${code}?ok=oculta`);
}

export async function withdrawHelpRequest(formData: FormData): Promise<void> {
  const session = await requireStaffSession();
  const code = formValue(formData, "code");
  if (!code) redirect("/moderacion");

  const supabase = await createAuthServerClient();
  const requestId = await requireMutableRequest(supabase, code);

  const { error } = await supabase
    .from("help_requests")
    .update({
      moderation_status: "retirada",
      withdrawn_at: new Date().toISOString(),
    })
    .eq("request_id", requestId);

  if (error) redirect(`/moderacion/${code}?error=retirar`);

  await logModeration(supabase, "withdraw", requestId, session.userId);
  redirect(`/moderacion/${code}?ok=retirada`);
}

export async function markDuplicateHelpRequest(
  formData: FormData,
): Promise<void> {
  const session = await requireStaffSession();
  const code = formValue(formData, "code");
  const duplicateOfCode = formValue(formData, "duplicateOfCode");
  if (!code) redirect("/moderacion");

  const supabase = await createAuthServerClient();
  const requestId = await requireMutableRequest(supabase, code);

  let duplicateOfId: number | null = null;
  if (duplicateOfCode) {
    duplicateOfId = await findRequestId(supabase, duplicateOfCode);
    if (!duplicateOfId || duplicateOfId === requestId) {
      redirect(`/moderacion/${code}?error=duplicado_invalido`);
    }
  }

  const { error } = await supabase
    .from("help_requests")
    .update({ moderation_status: "duplicado", duplicate_of: duplicateOfId })
    .eq("request_id", requestId);

  if (error) redirect(`/moderacion/${code}?error=marcar_duplicado`);

  await logModeration(supabase, "mark_duplicate", requestId, session.userId, {
    duplicateOfCode: duplicateOfCode || null,
  });
  redirect(`/moderacion/${code}?ok=duplicado`);
}

export async function setPriorityHelpRequest(
  formData: FormData,
): Promise<void> {
  const session = await requireStaffSession();
  const code = formValue(formData, "code");
  const priority = formValue(formData, "priority");
  if (!code) redirect("/moderacion");

  if (!isPriorityLevel(priority)) {
    redirect(`/moderacion/${code}?error=prioridad_invalida`);
  }

  const supabase = await createAuthServerClient();
  const requestId = await requireMutableRequest(supabase, code);

  const { error } = await supabase
    .from("help_requests")
    .update({ priority })
    .eq("request_id", requestId);

  if (error) redirect(`/moderacion/${code}?error=prioridad`);

  await logModeration(supabase, "set_priority", requestId, session.userId, {
    priority,
  });
  redirect(`/moderacion/${code}?ok=prioridad`);
}

const NEIGHBORHOOD_CODE_MAX_LENGTH = 80;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, NEIGHBORHOOD_CODE_MAX_LENGTH);
}

/**
 * RF-6.4 — the only part of moderation that improves the catalog instead
 * of just correcting a single row: a barrio that didn't match anything
 * lands here with comuna_code/neighborhood_code both null, the Moderator
 * resolves it, and can add the barrio to `neighborhoods` at the same time
 * so the next matching submission resolves on its own.
 */
export async function assignComunaHelpRequest(
  formData: FormData,
): Promise<void> {
  const session = await requireStaffSession();
  const code = formValue(formData, "code");
  const comunaCode = formValue(formData, "comunaCode");
  const newNeighborhoodName = formValue(formData, "newNeighborhoodName");
  if (!code) redirect("/moderacion");

  if (!comunaCode) {
    redirect(`/moderacion/${code}?error=comuna_requerida`);
  }

  const supabase = await createAuthServerClient();
  const requestId = await requireMutableRequest(supabase, code);

  let neighborhoodCode: string | null = null;

  if (newNeighborhoodName) {
    const slug = slugify(newNeighborhoodName);
    if (!slug) {
      redirect(`/moderacion/${code}?error=barrio_invalido`);
    }

    const { error: neighborhoodError } = await supabase
      .from("neighborhoods")
      .upsert(
        { neighborhood_code: slug, name: newNeighborhoodName, comuna_code: comunaCode },
        { onConflict: "neighborhood_code" },
      );

    if (neighborhoodError) {
      redirect(`/moderacion/${code}?error=barrio`);
    }

    neighborhoodCode = slug;
  }

  const { error } = await supabase
    .from("help_requests")
    .update({ comuna_code: comunaCode, neighborhood_code: neighborhoodCode })
    .eq("request_id", requestId);

  if (error) redirect(`/moderacion/${code}?error=comuna`);

  await logModeration(supabase, "update", requestId, session.userId, {
    comunaCode,
    neighborhoodCode,
    addedNeighborhood: Boolean(newNeighborhoodName),
  });
  redirect(`/moderacion/${code}?ok=comuna`);
}

/**
 * RF-6.5 — a bad photo shouldn't cost a legitimate post its visibility.
 * Removes only the photo: photo_path goes to NULL, moderation_status is
 * untouched, so the post stays exactly as visible as it was.
 *
 * Storage deletion needs service_role: there are no storage.objects
 * policies for this bucket at all (see
 * supabase/migrations/*_create_photo_buckets.sql) — anon uploads through
 * publish.ts's service_role client, and this is the only other path that
 * touches that bucket, so it uses the same one.
 */
export async function removePhotoHelpRequest(
  formData: FormData,
): Promise<void> {
  const session = await requireStaffSession();
  const code = formValue(formData, "code");
  if (!code) redirect("/moderacion");

  const supabase = await createAuthServerClient();

  const { data } = await supabase
    .from("help_requests")
    .select("request_id, moderation_status, photo_path")
    .eq("reference_code", code)
    .maybeSingle();

  if (!data) redirect("/moderacion");
  if (data.moderation_status === "retirada") {
    redirect(`/moderacion/${code}?error=ya_retirada`);
  }
  if (!data.photo_path) {
    redirect(`/moderacion/${code}?error=sin_foto`);
  }

  const serviceClient = createServiceRoleSupabaseClient();
  const { error: storageError } = await serviceClient.storage
    .from(PHOTO_BUCKET)
    .remove([data.photo_path]);

  if (storageError) {
    redirect(`/moderacion/${code}?error=foto`);
  }

  const { error } = await supabase
    .from("help_requests")
    .update({ photo_path: null })
    .eq("request_id", data.request_id);

  if (error) redirect(`/moderacion/${code}?error=foto`);

  await logModeration(supabase, "update", data.request_id, session.userId, {
    removedPhoto: true,
  });
  redirect(`/moderacion/${code}?ok=foto_retirada`);
}
