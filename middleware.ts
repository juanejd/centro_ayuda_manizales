import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/shared/supabase/env";

/**
 * Refreshes the Supabase auth session cookie on every request. Required by
 * @supabase/ssr for Next.js — without it, a session silently goes stale
 * mid-visit because nothing else in the request lifecycle rotates the
 * token. Runs for every route (matcher below only excludes static assets),
 * not just /moderacion: an anonymous visitor with no session cookie is a
 * no-op here, it does not gate access — the actual staff check lives in
 * src/app/moderacion/layout.tsx.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const environment = getPublicSupabaseEnv();

  const supabase = createServerClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // The call itself is what refreshes the token; the resolved user is not
  // otherwise used here.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
