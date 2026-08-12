import "server-only";

import { redirect } from "next/navigation";

import { getCurrentStaffSession } from "@/modules/moderation/queries";
import { createAuthServerClient } from "@/shared/supabase/auth-server";

/**
 * Small helpers shared by the unit 6.5-6.7 Server Actions
 * (src/modules/moderation/actions/resources.ts and .../alerts.ts). Unit
 * 6.1-6.4's moderate.ts keeps its own private copies of the same shapes —
 * this file does not touch it, it only avoids a third and fourth copy for
 * the institutional-content actions added in this phase.
 */

export type ModerationLogEntityType =
  | "help_request"
  | "help_offer"
  | "info_resource"
  | "alert";

export type ModerationLogAction =
  | "verify"
  | "hide"
  | "withdraw"
  | "mark_duplicate"
  | "set_priority"
  | "resolve"
  | "update"
  | "publish"
  | "unpublish"
  | "create"
  | "expire";

/**
 * Every action re-derives the staff session instead of trusting the caller:
 * a Server Action is a public HTTP endpoint by construction, not gated by
 * the (protected) layout that only guards page renders. RLS
 * (private.is_staff()) is the real backstop underneath this — this check
 * just turns an RLS rejection into a clean redirect instead of a raw
 * Postgres error reaching the moderator.
 */
export async function requireStaffSession() {
  const session = await getCurrentStaffSession();
  if (!session?.role) {
    redirect("/moderacion/login");
  }
  return session;
}

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Unit 6.3's audit-trail rationale applies to every moderation action in
 * this phase, not just help_requests ones: moderation_log has no UPDATE or
 * DELETE policy for any role, so every mutation below writes one row here.
 */
export async function logModeration(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  entityType: ModerationLogEntityType,
  action: ModerationLogAction,
  entityId: number,
  actorUserId: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  await supabase.from("moderation_log").insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor: actorUserId,
    payload: payload ?? null,
  });
}
