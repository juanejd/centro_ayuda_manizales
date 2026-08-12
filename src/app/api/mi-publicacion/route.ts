import { NextResponse } from "next/server";

import { helpRequestCorrectionSchema } from "@/modules/help-requests/domain/validation";
import { resolveManagedHelpRequest } from "@/modules/help-requests/queries";
import { getHashedClientIp } from "@/shared/security/hashed-client-ip";
import { createServerSupabaseClient } from "@/shared/supabase/server";
import { createServiceRoleSupabaseClient } from "@/shared/supabase/service-role";

// RF-4: a route handler, not a Server Action, specifically because this
// endpoint must be able to answer with a real HTTP 429 after 10 attempts in
// 10 minutes — a Server Action always resolves 200 to the client, it cannot
// set the response status.
const RATE_LIMIT_SCOPE = "manage_help_request";
const RATE_LIMIT_MAX_HITS = 10;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

// A standalone, inline-styled fragment — not a Next.js page — because these
// are the exact paths (wrong token, rate-limited) that must return their own
// HTTP status directly rather than via a redirect, so there's no app shell
// to render into.
function htmlResponse(status: number, title: string, message: string): Response {
  const body = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
</head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#1a1a1a">
<h1 style="font-size:1.25rem">${title}</h1>
<p>${message}</p>
<p><a href="/necesidades" style="color:#1d4ed8">Volver al tablero de necesidades</a></p>
</body>
</html>`;

  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();

  const code = formValue(formData, "code");
  const token = formValue(formData, "token");
  const action = formValue(formData, "action");

  if (!code || !token) {
    return htmlResponse(
      400,
      "Solicitud inválida",
      "Falta el código o el enlace de gestión.",
    );
  }

  const manageHref = `/mi-publicacion?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`;

  // Checked BEFORE the token lookup below: a wrong-token guesser is exactly
  // who this limit exists to slow down, so the attempt must count even when
  // it fails the lookup that follows.
  const anonClient = createServerSupabaseClient();
  const hashedIp = await getHashedClientIp();
  const { data: allowed, error: rateLimitError } = await anonClient.rpc(
    "check_rate_limit",
    {
      p_scope: RATE_LIMIT_SCOPE,
      p_client_key: hashedIp,
      p_max_hits: RATE_LIMIT_MAX_HITS,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    },
  );

  if (rateLimitError) {
    return htmlResponse(
      500,
      "No se pudo procesar",
      "Intenta de nuevo en unos minutos.",
    );
  }

  if (allowed === false) {
    return htmlResponse(
      429,
      "Demasiados intentos",
      "Espera unos minutos antes de volver a intentar.",
    );
  }

  // Same response for "no such code" and "wrong token" — distinguishing
  // them would let this endpoint be used to enumerate valid reference
  // codes one guess at a time.
  const managed = await resolveManagedHelpRequest(code, token);
  if (!managed) {
    return htmlResponse(
      403,
      "Código o enlace incorrecto",
      "Revisa el enlace de gestión que guardaste al publicar la necesidad.",
    );
  }

  if (managed.moderationStatus === "retirada") {
    return htmlResponse(
      409,
      "Publicación ya retirada",
      "Esta necesidad ya fue retirada y no se puede modificar.",
    );
  }

  const serviceClient = createServiceRoleSupabaseClient();

  if (action === "resolver") {
    if (managed.fulfillmentStatus === "abierta") {
      await serviceClient
        .from("help_requests")
        .update({
          fulfillment_status: "atendida",
          resolved_at: new Date().toISOString(),
        })
        .eq("request_id", managed.requestId);
    }
    return NextResponse.redirect(
      new URL(`${manageHref}&ok=resuelta`, request.url),
      303,
    );
  }

  if (action === "retirar") {
    await serviceClient
      .from("help_requests")
      .update({
        moderation_status: "retirada",
        withdrawn_at: new Date().toISOString(),
      })
      .eq("request_id", managed.requestId);
    return NextResponse.redirect(
      new URL(`${manageHref}&ok=retirada`, request.url),
      303,
    );
  }

  if (action === "corregir") {
    const parsed = helpRequestCorrectionSchema.safeParse({
      category: formValue(formData, "category"),
      description: formValue(formData, "description"),
      sector: formValue(formData, "sector"),
      contactName: formValue(formData, "contactName"),
      contactPhone: formValue(formData, "contactPhone"),
    });

    if (!parsed.success) {
      return NextResponse.redirect(
        new URL(`${manageHref}&error=validacion`, request.url),
        303,
      );
    }

    await serviceClient
      .from("help_requests")
      .update({
        category: parsed.data.category,
        description: parsed.data.description,
        sector: parsed.data.sector,
        contact_name: parsed.data.contactName,
        contact_phone: parsed.data.contactPhone,
      })
      .eq("request_id", managed.requestId);

    return NextResponse.redirect(
      new URL(`${manageHref}&ok=corregido`, request.url),
      303,
    );
  }

  return htmlResponse(400, "Acción no reconocida", "");
}
