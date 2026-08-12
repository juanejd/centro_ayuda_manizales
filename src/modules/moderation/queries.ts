import "server-only";

import {
  isHelpRequestCategory,
  isPriorityLevel,
  type HelpRequestCategory,
  type ModerationStatus,
  type PriorityLevel,
} from "@/modules/help-requests/domain/validation";
import { UNASSIGNED_ZONE_VALUE } from "@/modules/help-requests/queries";
import { createAuthServerClient } from "@/shared/supabase/auth-server";

export type StaffRole = "moderator" | "admin";

export type CurrentStaffSession = {
  userId: string;
  email: string | null;
  // null means: authenticated, but absent from staff_members. RLS
  // (staff_members_self_read) lets a user read their OWN row even when it
  // doesn't exist as staff — that's what makes this distinction possible
  // without a service-role lookup. See unit 6.1's "the case that matters is
  // the middle one" note in fase-6-moderacion.md.
  role: StaffRole | null;
};

/**
 * Returns null only for "not authenticated at all". An authenticated user
 * who isn't staff still gets a non-null result with role: null — the
 * caller (the (protected) layout) is what turns that into "access denied"
 * rather than a redirect, since redirecting an already-authenticated user
 * back to the login page would just loop.
 */
export async function getCurrentStaffSession(): Promise<CurrentStaffSession | null> {
  const supabase = await createAuthServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("staff_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: (data?.role as StaffRole | undefined) ?? null,
  };
}

export const INBOX_PAGE_SIZE = 25;

export type InboxHelpRequest = {
  requestId: number;
  referenceCode: string;
  createdAt: string;
  category: HelpRequestCategory;
  description: string;
  sector: string;
  neighborhood: string | null;
  neighborhoodCode: string | null;
  comuna: string | null;
  comunaCode: string | null;
  address: string | null;
  // Exact, unlike public_help_requests — RF-6.2's whole point.
  latitude: number | null;
  longitude: number | null;
  affectedPeople: number | null;
  contactName: string;
  contactPhone: string;
  photoPath: string | null;
  moderationStatus: ModerationStatus;
  fulfillmentStatus: "abierta" | "atendida";
  priority: PriorityLevel | null;
  duplicateOf: number | null;
  verifiedSource: string | null;
  verifiedAt: string | null;
  resolvedAt: string | null;
  withdrawnAt: string | null;
};

export type InboxFilters = {
  category?: string | null;
  comunaCode?: string | null;
  moderationStatus?: string | null;
  priority?: string | null;
  page?: number;
};

type EmbeddedName = { name: string } | { name: string }[] | null;

function embeddedName(embed: EmbeddedName): string | null {
  if (!embed) return null;
  return Array.isArray(embed) ? (embed[0]?.name ?? null) : embed.name;
}

type InboxRow = {
  request_id: number;
  reference_code: string;
  created_at: string;
  category: HelpRequestCategory;
  description: string;
  sector: string;
  neighborhood_code: string | null;
  comuna_code: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  affected_people: number | null;
  contact_name: string;
  contact_phone: string;
  photo_path: string | null;
  moderation_status: ModerationStatus;
  fulfillment_status: "abierta" | "atendida";
  priority: PriorityLevel | null;
  duplicate_of: number | null;
  verified_source: string | null;
  verified_at: string | null;
  resolved_at: string | null;
  withdrawn_at: string | null;
  neighborhoods: EmbeddedName;
  comunas: EmbeddedName;
};

const INBOX_COLUMNS =
  "request_id, reference_code, created_at, category, description, sector, neighborhood_code, comuna_code, address, latitude, longitude, affected_people, contact_name, contact_phone, photo_path, moderation_status, fulfillment_status, priority, duplicate_of, verified_source, verified_at, resolved_at, withdrawn_at, neighborhoods(name), comunas(name)";

/**
 * RF-6.2. Reads help_requests directly (not public_help_requests): RLS's
 * help_requests_staff_select policy is what authorizes this, gated on
 * private.is_staff(). Deliberately does NOT filter by moderation_status,
 * expires_at, or the 48h-fulfilled window the public view applies — the
 * inbox exists specifically to show oculta/retirada rows and everything
 * else the board hides.
 */
export async function listInboxHelpRequests(
  filters: InboxFilters = {},
): Promise<{ items: InboxHelpRequest[]; hasMore: boolean }> {
  const supabase = await createAuthServerClient();

  let request = supabase.from("help_requests").select(INBOX_COLUMNS);

  if (isHelpRequestCategory(filters.category)) {
    request = request.eq("category", filters.category);
  }

  if (filters.comunaCode === UNASSIGNED_ZONE_VALUE) {
    request = request.is("comuna_code", null);
  } else if (filters.comunaCode) {
    request = request.eq("comuna_code", filters.comunaCode);
  }

  if (filters.moderationStatus) {
    request = request.eq("moderation_status", filters.moderationStatus);
  }

  if (filters.priority === "sin-asignar") {
    request = request.is("priority", null);
  } else if (isPriorityLevel(filters.priority)) {
    request = request.eq("priority", filters.priority);
  }

  const page =
    Number.isInteger(filters.page) && (filters.page as number) > 0
      ? (filters.page as number)
      : 1;
  const offset = (page - 1) * INBOX_PAGE_SIZE;

  const { data, error } = await request
    .order("created_at", { ascending: false })
    .range(offset, offset + INBOX_PAGE_SIZE);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as InboxRow[];
  const hasMore = rows.length > INBOX_PAGE_SIZE;

  return {
    items: rows.slice(0, INBOX_PAGE_SIZE).map(toInboxHelpRequest),
    hasMore,
  };
}

function toInboxHelpRequest(row: InboxRow): InboxHelpRequest {
  return {
    requestId: row.request_id,
    referenceCode: row.reference_code,
    createdAt: row.created_at,
    category: row.category,
    description: row.description,
    sector: row.sector,
    neighborhood: embeddedName(row.neighborhoods),
    neighborhoodCode: row.neighborhood_code,
    comuna: embeddedName(row.comunas),
    comunaCode: row.comuna_code,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    affectedPeople: row.affected_people,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    photoPath: row.photo_path,
    moderationStatus: row.moderation_status,
    fulfillmentStatus: row.fulfillment_status,
    priority: row.priority,
    duplicateOf: row.duplicate_of,
    verifiedSource: row.verified_source,
    verifiedAt: row.verified_at,
    resolvedAt: row.resolved_at,
    withdrawnAt: row.withdrawn_at,
  };
}

export async function getInboxHelpRequestByCode(
  referenceCode: string,
): Promise<InboxHelpRequest | null> {
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("help_requests")
    .select(INBOX_COLUMNS)
    .eq("reference_code", referenceCode)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toInboxHelpRequest(data as unknown as InboxRow);
}
