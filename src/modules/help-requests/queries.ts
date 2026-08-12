import "server-only";

import { timingSafeEqual } from "node:crypto";

import {
  isHelpRequestCategory,
  type HelpRequestCategory,
} from "@/modules/help-requests/domain/validation";
import { createServerSupabaseClient } from "@/shared/supabase/server";
import { createServiceRoleSupabaseClient } from "@/shared/supabase/service-role";

const PHOTO_BUCKET = "help-request-photos";

// Shared by every page that renders a NeedCard or a need's own photo (the
// board, its detail page, the home page preview) so the bucket name and the
// getPublicUrl call live in exactly one place.
export function resolveHelpRequestPhotoUrl(
  photoPath: string | null,
): string | null {
  if (!photoPath) return null;
  const supabase = createServerSupabaseClient();
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(photoPath).data
    .publicUrl;
}

export type ComunaOption = {
  comuna_code: string;
  name: string;
  kind: "urbana" | "rural";
};

export type NeighborhoodOption = {
  neighborhood_code: string;
  name: string;
  comuna_code: string;
};

export async function listComunas(): Promise<ComunaOption[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("comunas")
    .select("comuna_code, name, kind")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as ComunaOption[];
}

export async function listNeighborhoods(): Promise<NeighborhoodOption[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("neighborhoods")
    .select("neighborhood_code, name, comuna_code")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as NeighborhoodOption[];
}

// RF-2.2: the board's "zona sin asignar" filter — a need with no comuna_code
// at all, not a real catalog value, so it needs a sentinel that can never
// collide with an actual comuna_code (those are short slugs like "la-enea").
export const UNASSIGNED_ZONE_VALUE = "sin-asignar";

// Hard ceiling, never sourced from a request param anywhere in this module.
// "page" only moves the offset; it can never make a single response exceed
// this many rows (RF-2 board checklist: the cap must not be raisable by any
// parameter).
export const HELP_REQUESTS_BOARD_PAGE_SIZE = 20;

export type HelpRequestBoardFilters = {
  // A list so fase 5's contribution filter (which can translate to several
  // categories at once, e.g. "servicios profesionales") reuses this exact
  // query — the board (fase 4) just always passes a single-element list.
  // Omitted or empty means "no category filter" (every category).
  categories?: readonly string[] | null;
  comunaCode?: string | null;
  query?: string | null;
  page?: number;
};

export type PublicHelpRequest = {
  referenceCode: string;
  createdAt: string;
  category: HelpRequestCategory;
  description: string;
  sector: string;
  neighborhood: string | null;
  comuna: string | null;
  comunaCode: string | null;
  address: string | null;
  affectedPeople: number | null;
  contactName: string;
  contactPhone: string;
  photoPath: string | null;
  moderationStatus: "sin_verificar" | "verificado" | "duplicado";
  fulfillmentStatus: "abierta" | "atendida";
  verifiedSource: string | null;
  verifiedAt: string | null;
  resolvedAt: string | null;
  latitudeApprox: number | null;
  longitudeApprox: number | null;
};

type PublicHelpRequestRow = {
  reference_code: string;
  created_at: string;
  category: HelpRequestCategory;
  description: string;
  sector: string;
  neighborhood: string | null;
  comuna: string | null;
  comuna_code: string | null;
  address: string | null;
  affected_people: number | null;
  contact_name: string;
  contact_phone: string;
  photo_path: string | null;
  moderation_status: "sin_verificar" | "verificado" | "duplicado";
  fulfillment_status: "abierta" | "atendida";
  verified_source: string | null;
  verified_at: string | null;
  resolved_at: string | null;
  latitude_approx: number | null;
  longitude_approx: number | null;
};

function toPublicHelpRequest(row: PublicHelpRequestRow): PublicHelpRequest {
  return {
    referenceCode: row.reference_code,
    createdAt: row.created_at,
    category: row.category,
    description: row.description,
    sector: row.sector,
    neighborhood: row.neighborhood,
    comuna: row.comuna,
    comunaCode: row.comuna_code,
    address: row.address,
    affectedPeople: row.affected_people,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    photoPath: row.photo_path,
    moderationStatus: row.moderation_status,
    fulfillmentStatus: row.fulfillment_status,
    verifiedSource: row.verified_source,
    verifiedAt: row.verified_at,
    resolvedAt: row.resolved_at,
    latitudeApprox: row.latitude_approx,
    longitudeApprox: row.longitude_approx,
  };
}

const BOARD_COLUMNS =
  "reference_code, created_at, category, description, sector, neighborhood, comuna, comuna_code, address, affected_people, contact_name, contact_phone, photo_path, moderation_status, fulfillment_status, verified_source, verified_at, resolved_at, latitude_approx, longitude_approx";

export async function getPublicHelpRequestByReferenceCode(
  referenceCode: string,
): Promise<PublicHelpRequest | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("public_help_requests")
    .select(BOARD_COLUMNS)
    .eq("reference_code", referenceCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return toPublicHelpRequest(data as unknown as PublicHelpRequestRow);
}

export async function listPublicHelpRequests(
  filters: HelpRequestBoardFilters = {},
): Promise<{ items: PublicHelpRequest[]; hasMore: boolean }> {
  const supabase = createServerSupabaseClient();

  let request = supabase.from("public_help_requests").select(BOARD_COLUMNS);

  const validCategories = (filters.categories ?? []).filter(
    isHelpRequestCategory,
  );
  if (validCategories.length > 0) {
    request = request.in("category", validCategories);
  }

  if (filters.comunaCode === UNASSIGNED_ZONE_VALUE) {
    request = request.is("comuna_code", null);
  } else if (filters.comunaCode) {
    request = request.eq("comuna_code", filters.comunaCode);
  }

  // Stripped, not escaped: none of these characters carry meaning in a
  // plain-language search, so dropping them keeps the term literal instead
  // of risking it breaking out of PostgREST's .or() filter grammar (which
  // uses "," "(" ")" as structural separators).
  const term = filters.query?.trim().replace(/[,()"%]/g, "").slice(0, 160);
  if (term) {
    request = request.or(
      `description.ilike.%${term}%,sector.ilike.%${term}%`,
    );
  }

  const page =
    Number.isInteger(filters.page) && (filters.page as number) > 0
      ? (filters.page as number)
      : 1;
  const offset = (page - 1) * HELP_REQUESTS_BOARD_PAGE_SIZE;

  // Fetches one extra row past the cap purely to detect "is there a next
  // page" — toPublicHelpRequest below still only maps the first
  // HELP_REQUESTS_BOARD_PAGE_SIZE of them, so the response body itself
  // never exceeds the cap.
  const { data, error } = await request
    .order("created_at", { ascending: false })
    .range(offset, offset + HELP_REQUESTS_BOARD_PAGE_SIZE);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as PublicHelpRequestRow[];
  const hasMore = rows.length > HELP_REQUESTS_BOARD_PAGE_SIZE;

  return {
    items: rows.slice(0, HELP_REQUESTS_BOARD_PAGE_SIZE).map(toPublicHelpRequest),
    hasMore,
  };
}

// Constant-time so a wrong-token response takes the same time regardless of
// how many leading characters happened to match — a naive `===` on a UUID
// string is an unlikely but real timing side-channel for a value that
// authorizes withdrawing someone's emergency post without an account.
export function tokensMatch(expected: string, candidate: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const candidateBuffer = Buffer.from(candidate);

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, candidateBuffer);
}

export type ManagedHelpRequest = {
  requestId: number;
  referenceCode: string;
  category: HelpRequestCategory;
  description: string;
  sector: string;
  contactName: string;
  contactPhone: string;
  moderationStatus:
    | "sin_verificar"
    | "verificado"
    | "duplicado"
    | "oculta"
    | "retirada";
  fulfillmentStatus: "abierta" | "atendida";
};

type ManagedHelpRequestRow = {
  request_id: number;
  reference_code: string;
  category: HelpRequestCategory;
  description: string;
  sector: string;
  contact_name: string;
  contact_phone: string;
  manage_token: string;
  moderation_status: ManagedHelpRequest["moderationStatus"];
  fulfillment_status: ManagedHelpRequest["fulfillmentStatus"];
};

/**
 * Unit 4.9 — self-service manage/withdraw. help_requests has NO SELECT
 * grant for anon at all (see harden_public_grants.sql), so the only way to
 * look a request up by reference_code and check its manage_token is via the
 * service-role client, which bypasses RLS entirely. This is one of only two
 * places in the app that use service_role (the other is photo storage in
 * publish.ts) — the manage_token itself never becomes a database
 * credential, it is compared in application code after the fact.
 *
 * Returns null for BOTH "no such reference_code" and "wrong token" — never
 * distinguish the two in the response, or the endpoint becomes an oracle
 * for enumerating valid reference codes.
 */
export async function resolveManagedHelpRequest(
  referenceCode: string,
  manageToken: string,
): Promise<ManagedHelpRequest | null> {
  const serviceClient = createServiceRoleSupabaseClient();

  const { data, error } = await serviceClient
    .from("help_requests")
    .select(
      "request_id, reference_code, category, description, sector, contact_name, contact_phone, manage_token, moderation_status, fulfillment_status",
    )
    .eq("reference_code", referenceCode)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as ManagedHelpRequestRow;

  if (!tokensMatch(row.manage_token, manageToken)) {
    return null;
  }

  return {
    requestId: row.request_id,
    referenceCode: row.reference_code,
    category: row.category,
    description: row.description,
    sector: row.sector,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    moderationStatus: row.moderation_status,
    fulfillmentStatus: row.fulfillment_status,
  };
}
