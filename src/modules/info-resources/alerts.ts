import "server-only";

import { createServerSupabaseClient } from "@/shared/supabase/server";

export type Alert = {
  title: string;
  description: string;
  expiresAt: string | null;
  source: string;
};

const ALERT_COLUMNS = "title, description, source, expires_at";

type AlertRow = {
  title: string;
  description: string;
  source: string;
  expires_at: string | null;
};

function toAlert(row: AlertRow): Alert {
  return {
    title: row.title,
    description: row.description,
    expiresAt: row.expires_at,
    source: row.source,
  };
}

/**
 * RF-6.9 / unit 6.7. Replaces the previous hardcoded ALERTS array with a
 * query against the `alerts` table. alerts_public_read (RLS) already
 * restricts anon/authenticated to `is_published AND (expires_at IS NULL OR
 * expires_at > now())` — the .gt("expires_at", ...) / is-null filter below is
 * defense in depth, not the only enforcement, matching how listResources()
 * in info-resources/queries.ts filters is_published explicitly even though
 * info_resources_public_read enforces the same thing at the RLS layer.
 *
 * No `now` parameter, deliberately: matches getPriorityEmergencyLines()'s
 * own zero-argument signature two lines above this function's call site in
 * src/app/page.tsx, and "now" is evaluated server-side either way (both by
 * this query and by the RLS policy's own now()).
 */
export async function getActiveAlerts(): Promise<readonly Alert[]> {
  const supabase = createServerSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_COLUMNS)
    .eq("is_published", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AlertRow[]).map(toAlert);
}
