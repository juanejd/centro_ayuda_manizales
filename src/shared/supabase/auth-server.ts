import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/shared/supabase/env";

/**
 * The only Supabase client in this app that carries a real user session
 * (cookie-based, via @supabase/ssr). Every other client
 * (shared/supabase/server.ts, shared/supabase/service-role.ts) is
 * deliberately stateless — public reads/inserts and the two service_role
 * paths never needed a session. Moderation (fase 6) does: RLS policies
 * check private.is_staff(), which reads auth.uid() from this session.
 *
 * setAll can throw when called from a Server Component render (cookies are
 * read-only there); that's expected and harmless as long as middleware.ts
 * is also refreshing the session on every request, per Supabase's own
 * Next.js guidance.
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  const environment = getPublicSupabaseEnv();

  return createServerClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // See the doc comment above — safe to ignore during render.
          }
        },
      },
    },
  );
}
