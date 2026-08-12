"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

import {
  InvalidPhotoError,
  processHelpRequestPhoto,
} from "@/modules/help-requests/domain/photo-pipeline";
import {
  createResourceSchema,
  editResourceSchema,
  resourcePhotoSchema,
} from "@/modules/info-resources/domain";
import {
  formValue,
  logModeration,
  requireStaffSession,
} from "@/modules/moderation/actions/shared";
import { createAuthServerClient } from "@/shared/supabase/auth-server";
import { createServiceRoleSupabaseClient } from "@/shared/supabase/service-role";

const PHOTO_BUCKET = "info-resource-photos";

function optionalFormValue(
  formData: FormData,
  key: string,
): string | undefined {
  const value = formValue(formData, key);
  return value === "" ? undefined : value;
}

function optionalFormNumber(
  formData: FormData,
  key: string,
): number | undefined {
  const raw = optionalFormValue(formData, key);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN; // let Zod reject NaN
}

// Simplest option for an MVP staff tool (per the phase doc's own guidance):
// one textarea, split on newlines or commas server-side, instead of a
// dynamic multi-field-array UI.
function parsePhones(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((phone) => phone.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function resourceCandidateFromFormData(formData: FormData) {
  return {
    category: optionalFormValue(formData, "category"),
    name: optionalFormValue(formData, "name"),
    description: optionalFormValue(formData, "description"),
    address: optionalFormValue(formData, "address"),
    neighborhoodCode: optionalFormValue(formData, "neighborhoodCode"),
    comunaCode: optionalFormValue(formData, "comunaCode"),
    meetingPoint: optionalFormValue(formData, "meetingPoint"),
    latitude: optionalFormNumber(formData, "latitude"),
    longitude: optionalFormNumber(formData, "longitude"),
    phones: parsePhones(formValue(formData, "phones")),
    hours: optionalFormValue(formData, "hours"),
    source: optionalFormValue(formData, "source"),
    status: optionalFormValue(formData, "status"),
    verifiedAt: optionalFormValue(formData, "verifiedAt"),
  };
}

/**
 * Maps the first Zod issue to one of the fixed error codes the edit/create
 * pages know how to render — same shape as moderate.ts's ERROR_MESSAGES
 * redirect pattern, not a full field-by-field error report (this is a
 * low-traffic staff form, not worth more).
 */
function errorCodeForIssues(issues: { path: PropertyKey[] }[]): string {
  const key = issues[0]?.path[0];
  if (key === "slug") return "slug_invalido";
  if (key === "source") return "fuente_requerida";
  if (key === "verifiedAt") return "fecha_requerida";
  if (key === "neighborhoodCode" || key === "comunaCode") {
    return "zona_invalida";
  }
  return "datos_invalidos";
}

const UNIQUE_VIOLATION = "23505";

export async function createInfoResource(formData: FormData): Promise<void> {
  const session = await requireStaffSession();

  const candidate = {
    slug: formValue(formData, "slug"),
    ...resourceCandidateFromFormData(formData),
  };
  const parsed = createResourceSchema.safeParse(candidate);

  if (!parsed.success) {
    redirect(
      `/moderacion/recursos/nuevo?error=${errorCodeForIssues(parsed.error.issues)}`,
    );
  }

  const input = parsed.data;
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("info_resources")
    .insert({
      slug: input.slug,
      category: input.category,
      name: input.name,
      description: input.description ?? null,
      address: input.address ?? null,
      neighborhood_code: input.neighborhoodCode ?? null,
      comuna_code: input.comunaCode ?? null,
      meeting_point: input.meetingPoint ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      phones: input.phones,
      hours: input.hours ?? null,
      source: input.source ?? null,
      status: input.status,
      verified_at: input.verifiedAt
        ? new Date(input.verifiedAt).toISOString()
        : null,
      updated_by: session.userId,
    })
    .select("resource_id")
    .maybeSingle();

  if (error || !data) {
    if ((error as { code?: string } | null)?.code === UNIQUE_VIOLATION) {
      redirect(`/moderacion/recursos/nuevo?error=slug_duplicado`);
    }
    redirect(`/moderacion/recursos/nuevo?error=crear`);
  }

  await logModeration(
    supabase,
    "info_resource",
    "create",
    data.resource_id,
    session.userId,
    { slug: input.slug },
  );
  redirect(`/moderacion/recursos/${input.slug}?ok=creado`);
}

export async function updateInfoResource(formData: FormData): Promise<void> {
  const session = await requireStaffSession();
  const slug = formValue(formData, "slug");
  if (!slug) redirect("/moderacion/recursos");

  const parsed = editResourceSchema.safeParse(
    resourceCandidateFromFormData(formData),
  );

  if (!parsed.success) {
    redirect(
      `/moderacion/recursos/${slug}?error=${errorCodeForIssues(parsed.error.issues)}`,
    );
  }

  const input = parsed.data;
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("info_resources")
    .update({
      category: input.category,
      name: input.name,
      description: input.description ?? null,
      address: input.address ?? null,
      neighborhood_code: input.neighborhoodCode ?? null,
      comuna_code: input.comunaCode ?? null,
      meeting_point: input.meetingPoint ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      phones: input.phones,
      hours: input.hours ?? null,
      source: input.source ?? null,
      status: input.status,
      verified_at: input.verifiedAt
        ? new Date(input.verifiedAt).toISOString()
        : null,
      updated_by: session.userId,
    })
    .eq("slug", slug)
    .select("resource_id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/moderacion/recursos/${slug}?error=actualizar`);
  }

  await logModeration(
    supabase,
    "info_resource",
    "update",
    data.resource_id,
    session.userId,
  );
  redirect(`/moderacion/recursos/${slug}?ok=actualizado`);
}

async function setResourcePublished(
  formData: FormData,
  isPublished: boolean,
): Promise<void> {
  const session = await requireStaffSession();
  const slug = formValue(formData, "slug");
  if (!slug) redirect("/moderacion/recursos");

  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("info_resources")
    .update({ is_published: isPublished, updated_by: session.userId })
    .eq("slug", slug)
    .select("resource_id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/moderacion/recursos/${slug}?error=publicar`);
  }

  await logModeration(
    supabase,
    "info_resource",
    isPublished ? "publish" : "unpublish",
    data.resource_id,
    session.userId,
  );
  redirect(
    `/moderacion/recursos/${slug}?ok=${isPublished ? "publicado" : "despublicado"}`,
  );
}

export async function publishInfoResource(formData: FormData): Promise<void> {
  await setResourcePublished(formData, true);
}

export async function unpublishInfoResource(
  formData: FormData,
): Promise<void> {
  await setResourcePublished(formData, false);
}

/**
 * Unit 6.6 — mandatory alt text, enforced before any upload happens (RF's
 * own checklist: "no se puede guardar una foto sin texto alternativo").
 * Reuses processHelpRequestPhoto for metadata stripping (RNF-5.7 applies to
 * institutional photos too) and the service_role storage pattern from
 * publish.ts — info_resource_photos has no storage.objects policy of its
 * own, same as help-request-photos.
 */
export async function addInfoResourcePhoto(
  formData: FormData,
): Promise<void> {
  const session = await requireStaffSession();
  const slug = formValue(formData, "slug");
  if (!slug) redirect("/moderacion/recursos");

  const captionParsed = resourcePhotoSchema.safeParse({
    caption: formValue(formData, "caption"),
  });
  if (!captionParsed.success) {
    redirect(`/moderacion/recursos/${slug}?error=texto_alternativo_requerido`);
  }

  const photoFile = formData.get("photo");
  if (!(photoFile instanceof File) || photoFile.size === 0) {
    redirect(`/moderacion/recursos/${slug}?error=foto_requerida`);
  }

  const supabase = await createAuthServerClient();

  const { data: resource } = await supabase
    .from("info_resources")
    .select("resource_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!resource) redirect("/moderacion/recursos");

  let processed: Buffer;
  try {
    const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
    processed = await processHelpRequestPhoto(inputBuffer);
  } catch (error) {
    if (error instanceof InvalidPhotoError) {
      redirect(`/moderacion/recursos/${slug}?error=foto_invalida`);
    }
    redirect(`/moderacion/recursos/${slug}?error=foto_procesar`);
  }

  const path = `${randomUUID()}.jpg`;
  const serviceClient = createServiceRoleSupabaseClient();
  const { error: uploadError } = await serviceClient.storage
    .from(PHOTO_BUCKET)
    .upload(path, processed, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    redirect(`/moderacion/recursos/${slug}?error=foto_guardar`);
  }

  const { data: existingPhotos } = await supabase
    .from("info_resource_photos")
    .select("sort_order")
    .eq("resource_id", resource.resource_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (existingPhotos?.[0]?.sort_order ?? -1) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("info_resource_photos")
    .insert({
      resource_id: resource.resource_id,
      storage_path: path,
      caption: captionParsed.data.caption,
      sort_order: nextSortOrder,
    })
    .select("photo_id")
    .maybeSingle();

  if (insertError || !inserted) {
    await serviceClient.storage.from(PHOTO_BUCKET).remove([path]);
    redirect(`/moderacion/recursos/${slug}?error=foto_guardar`);
  }

  await logModeration(
    supabase,
    "info_resource",
    "update",
    resource.resource_id,
    session.userId,
    { addedPhoto: true, photoId: inserted.photo_id },
  );
  redirect(`/moderacion/recursos/${slug}?ok=foto_agregada`);
}

export async function removeInfoResourcePhoto(
  formData: FormData,
): Promise<void> {
  const session = await requireStaffSession();
  const slug = formValue(formData, "slug");
  const photoId = Number.parseInt(formValue(formData, "photoId"), 10);
  if (!slug) redirect("/moderacion/recursos");

  if (!Number.isInteger(photoId)) {
    redirect(`/moderacion/recursos/${slug}?error=foto_invalida`);
  }

  const supabase = await createAuthServerClient();

  const { data: photo } = await supabase
    .from("info_resource_photos")
    .select("photo_id, resource_id, storage_path")
    .eq("photo_id", photoId)
    .maybeSingle();

  if (!photo) redirect(`/moderacion/recursos/${slug}?error=foto_no_encontrada`);

  const serviceClient = createServiceRoleSupabaseClient();
  const { error: storageError } = await serviceClient.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);

  if (storageError) {
    redirect(`/moderacion/recursos/${slug}?error=foto_retirar`);
  }

  const { error: deleteError } = await supabase
    .from("info_resource_photos")
    .delete()
    .eq("photo_id", photo.photo_id);

  if (deleteError) {
    redirect(`/moderacion/recursos/${slug}?error=foto_retirar`);
  }

  await logModeration(
    supabase,
    "info_resource",
    "update",
    photo.resource_id,
    session.userId,
    { removedPhoto: true, photoId: photo.photo_id },
  );
  redirect(`/moderacion/recursos/${slug}?ok=foto_retirada`);
}
