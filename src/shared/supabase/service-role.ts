import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/shared/supabase/env";

export function createServiceRoleSupabaseClient() {
  const environment = getSupabaseEnv();

  return createClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
