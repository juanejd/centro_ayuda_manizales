"use server";

import { redirect } from "next/navigation";

import { alertFieldsSchema } from "@/modules/info-resources/domain";
import {
  formValue,
  logModeration,
  requireStaffSession,
} from "@/modules/moderation/actions/shared";
import { createAuthServerClient } from "@/shared/supabase/auth-server";

function optionalFormValue(
  formData: FormData,
  key: string,
): string | undefined {
  const value = formValue(formData, key);
  return value === "" ? undefined : value;
}

function alertCandidateFromFormData(formData: FormData) {
  return {
    title: optionalFormValue(formData, "title"),
    description: optionalFormValue(formData, "description"),
    source: optionalFormValue(formData, "source"),
    expiresAt: optionalFormValue(formData, "expiresAt"),
  };
}

function errorCodeForIssues(issues: { path: PropertyKey[] }[]): string {
  const key = issues[0]?.path[0];
  if (key === "source") return "fuente_requerida";
  if (key === "expiresAt") return "fecha_invalida";
  return "datos_invalidos";
}

export async function createAlert(formData: FormData): Promise<void> {
  const session = await requireStaffSession();
  const parsed = alertFieldsSchema.safeParse(
    alertCandidateFromFormData(formData),
  );

  if (!parsed.success) {
    redirect(
      `/moderacion/alertas/nueva?error=${errorCodeForIssues(parsed.error.issues)}`,
    );
  }

  const input = parsed.data;
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      title: input.title,
      description: input.description,
      source: input.source,
      expires_at: input.expiresAt
        ? new Date(input.expiresAt).toISOString()
        : null,
      updated_by: session.userId,
    })
    .select("alert_id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/moderacion/alertas/nueva?error=crear`);
  }

  await logModeration(
    supabase,
    "alert",
    "create",
    data.alert_id,
    session.userId,
  );
  redirect(`/moderacion/alertas/${data.alert_id}?ok=creada`);
}

export async function updateAlert(formData: FormData): Promise<void> {
  const session = await requireStaffSession();
  const alertId = Number.parseInt(formValue(formData, "alertId"), 10);
  if (!Number.isInteger(alertId)) redirect("/moderacion/alertas");

  const parsed = alertFieldsSchema.safeParse(
    alertCandidateFromFormData(formData),
  );

  if (!parsed.success) {
    redirect(
      `/moderacion/alertas/${alertId}?error=${errorCodeForIssues(parsed.error.issues)}`,
    );
  }

  const input = parsed.data;
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("alerts")
    .update({
      title: input.title,
      description: input.description,
      source: input.source,
      expires_at: input.expiresAt
        ? new Date(input.expiresAt).toISOString()
        : null,
      updated_by: session.userId,
    })
    .eq("alert_id", alertId)
    .select("alert_id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/moderacion/alertas/${alertId}?error=actualizar`);
  }

  await logModeration(supabase, "alert", "update", alertId, session.userId);
  redirect(`/moderacion/alertas/${alertId}?ok=actualizada`);
}

async function setAlertPublished(
  formData: FormData,
  isPublished: boolean,
): Promise<void> {
  const session = await requireStaffSession();
  const alertId = Number.parseInt(formValue(formData, "alertId"), 10);
  if (!Number.isInteger(alertId)) redirect("/moderacion/alertas");

  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("alerts")
    .update({ is_published: isPublished, updated_by: session.userId })
    .eq("alert_id", alertId)
    .select("alert_id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/moderacion/alertas/${alertId}?error=publicar`);
  }

  await logModeration(
    supabase,
    "alert",
    isPublished ? "publish" : "unpublish",
    alertId,
    session.userId,
  );
  redirect(
    `/moderacion/alertas/${alertId}?ok=${isPublished ? "publicada" : "despublicada"}`,
  );
}

export async function publishAlert(formData: FormData): Promise<void> {
  await setAlertPublished(formData, true);
}

export async function unpublishAlert(formData: FormData): Promise<void> {
  await setAlertPublished(formData, false);
}

/**
 * Unit 6.7's "vencer": sets expires_at to now(), immediately — distinct
 * from unpublish, which just flips a boolean a moderator can undo with
 * another click. Once vencida, alerts_public_read (RLS) hides it on its
 * own on the next read; there is no cron sweep to wait for.
 */
export async function expireAlert(formData: FormData): Promise<void> {
  const session = await requireStaffSession();
  const alertId = Number.parseInt(formValue(formData, "alertId"), 10);
  if (!Number.isInteger(alertId)) redirect("/moderacion/alertas");

  const supabase = await createAuthServerClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("alerts")
    .update({ expires_at: nowIso, updated_by: session.userId })
    .eq("alert_id", alertId)
    .select("alert_id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/moderacion/alertas/${alertId}?error=vencer`);
  }

  await logModeration(supabase, "alert", "expire", alertId, session.userId);
  redirect(`/moderacion/alertas/${alertId}?ok=vencida`);
}
