import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/shared/supabase/env";

export function createServerSupabaseClient() {
  const environment = getSupabaseEnv();

  return createClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
