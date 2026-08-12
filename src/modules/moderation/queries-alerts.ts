import "server-only";

import { createAuthServerClient } from "@/shared/supabase/auth-server";

export type AdminAlert = {
  alertId: number;
  title: string;
  description: string;
  source: string;
  expiresAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

const ADMIN_ALERT_COLUMNS =
  "alert_id, title, description, source, expires_at, is_published, created_at, updated_at";

type AdminAlertRow = {
  alert_id: number;
  title: string;
  description: string;
  source: string;
  expires_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function toAdminAlert(row: AdminAlertRow): AdminAlert {
  return {
    alertId: row.alert_id,
    title: row.title,
    description: row.description,
    source: row.source,
    expiresAt: row.expires_at,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * RF-6.9 admin listing. Shows every alert regardless of is_published or
 * expiry — the public getActiveAlerts() in info-resources/alerts.ts is the
 * filtered one, this is its "shows hidden/expired too" counterpart, same
 * pattern as the moderation inbox vs. the public board.
 */
export async function listAdminAlerts(): Promise<AdminAlert[]> {
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("alerts")
    .select(ADMIN_ALERT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AdminAlertRow[]).map(toAdminAlert);
}

export async function getAdminAlertById(
  alertId: number,
): Promise<AdminAlert | null> {
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("alerts")
    .select(ADMIN_ALERT_COLUMNS)
    .eq("alert_id", alertId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toAdminAlert(data as unknown as AdminAlertRow);
}
