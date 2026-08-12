import "server-only";

import {
  isResourceCategory,
  type ResourceCategory,
  type ResourceStatus,
} from "@/modules/info-resources/domain";
import { createAuthServerClient } from "@/shared/supabase/auth-server";

export type AdminResource = {
  resourceId: number;
  slug: string;
  category: ResourceCategory;
  name: string;
  description: string | null;
  address: string | null;
  neighborhoodCode: string | null;
  comunaCode: string | null;
  meetingPoint: string | null;
  latitude: number | null;
  longitude: number | null;
  phones: string[];
  hours: string | null;
  source: string | null;
  status: ResourceStatus;
  verifiedAt: string | null;
  isPublished: boolean;
  updatedAt: string;
};

export type AdminResourceFilters = {
  category?: string | null;
  status?: string | null;
};

const ADMIN_RESOURCE_COLUMNS =
  "resource_id, slug, category, name, description, address, neighborhood_code, comuna_code, meeting_point, latitude, longitude, phones, hours, source, status, verified_at, is_published, updated_at";

type AdminResourceRow = {
  resource_id: number;
  slug: string;
  category: ResourceCategory;
  name: string;
  description: string | null;
  address: string | null;
  neighborhood_code: string | null;
  comuna_code: string | null;
  meeting_point: string | null;
  latitude: number | null;
  longitude: number | null;
  phones: string[] | null;
  hours: string | null;
  source: string | null;
  status: ResourceStatus;
  verified_at: string | null;
  is_published: boolean;
  updated_at: string;
};

function toAdminResource(row: AdminResourceRow): AdminResource {
  return {
    resourceId: row.resource_id,
    slug: row.slug,
    category: row.category,
    name: row.name,
    description: row.description,
    address: row.address,
    neighborhoodCode: row.neighborhood_code,
    comunaCode: row.comuna_code,
    meetingPoint: row.meeting_point,
    latitude: row.latitude,
    longitude: row.longitude,
    phones: row.phones ?? [],
    hours: row.hours,
    source: row.source,
    status: row.status,
    verifiedAt: row.verified_at,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

/**
 * RF-6.5 admin listing. Reads info_resources directly (not the public
 * directory query in info-resources/queries.ts), authorized by
 * info_resources_staff_all (private.is_staff()). Deliberately does NOT
 * filter by is_published or status — the whole point of a staff list is to
 * also show drafts and every status, same as the moderation inbox shows
 * oculta/retirada help_requests the public board hides.
 */
export async function listAdminResources(
  filters: AdminResourceFilters = {},
): Promise<AdminResource[]> {
  const supabase = await createAuthServerClient();

  let request = supabase.from("info_resources").select(ADMIN_RESOURCE_COLUMNS);

  if (isResourceCategory(filters.category)) {
    request = request.eq("category", filters.category);
  }

  if (filters.status) {
    request = request.eq("status", filters.status);
  }

  const { data, error } = await request.order("updated_at", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AdminResourceRow[]).map(toAdminResource);
}

export async function getAdminResourceBySlug(
  slug: string,
): Promise<AdminResource | null> {
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("info_resources")
    .select(ADMIN_RESOURCE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toAdminResource(data as unknown as AdminResourceRow);
}

export type AdminResourcePhoto = {
  photoId: number;
  storagePath: string;
  caption: string | null;
  sortOrder: number;
};

type AdminResourcePhotoRow = {
  photo_id: number;
  storage_path: string;
  caption: string | null;
  sort_order: number;
};

export async function listResourcePhotos(
  resourceId: number,
): Promise<AdminResourcePhoto[]> {
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("info_resource_photos")
    .select("photo_id, storage_path, caption, sort_order")
    .eq("resource_id", resourceId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AdminResourcePhotoRow[]).map((row) => ({
    photoId: row.photo_id,
    storagePath: row.storage_path,
    caption: row.caption,
    sortOrder: row.sort_order,
  }));
}
