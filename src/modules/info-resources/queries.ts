import "server-only";

import {
  PRIORITY_EMERGENCY_LINES,
  isResourceCategory,
  normalizePhoneText,
  resolveFreshness,
  type Freshness,
  type PriorityEmergencyLine,
  type ResourceCategory,
  type ResourceStatus,
} from "@/modules/info-resources/domain";
import { createServerSupabaseClient } from "@/shared/supabase/server";

const DEFAULT_LIST_LIMIT = 200;

export type DirectoryResource = {
  slug: string;
  category: ResourceCategory;
  name: string;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  comuna: string | null;
  comuna_code: string | null;
  phones: string[];
  hours: string | null;
  source: string | null;
  status: ResourceStatus;
  verified_at: string | null;
  freshness: Freshness;
};

export type ResourceDetail = DirectoryResource & {
  meeting_point: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: { storagePath: string; caption: string | null }[];
};

export type DirectoryFilters = {
  category?: string | null;
  comuna?: string | null;
  query?: string | null;
  limit?: number;
};

export type ComunaOption = {
  comuna_code: string;
  name: string;
  kind: "urbana" | "rural";
};

const LIST_COLUMNS =
  "slug, category, name, description, address, comuna_code, phones, hours, source, status, verified_at, comunas(name), neighborhoods(name)";

const DETAIL_COLUMNS = `${LIST_COLUMNS}, meeting_point, latitude, longitude, info_resource_photos(storage_path, caption, sort_order)`;

type EmbeddedName = { name: string } | { name: string }[] | null;

type ResourceRow = {
  slug: string;
  category: ResourceCategory;
  name: string;
  description: string | null;
  address: string | null;
  comuna_code: string | null;
  phones: string[] | null;
  hours: string | null;
  source: string | null;
  status: ResourceStatus;
  verified_at: string | null;
  comunas: EmbeddedName;
  neighborhoods: EmbeddedName;
};

type PhotoRow = {
  storage_path: string;
  caption: string | null;
  sort_order: number;
};

type ResourceDetailRow = ResourceRow & {
  meeting_point: string | null;
  latitude: number | null;
  longitude: number | null;
  info_resource_photos: PhotoRow[] | null;
};

function embeddedName(embed: EmbeddedName): string | null {
  if (!embed) {
    return null;
  }

  return Array.isArray(embed) ? (embed[0]?.name ?? null) : embed.name;
}

function toDirectoryResource(row: ResourceRow, now: Date): DirectoryResource {
  return {
    slug: row.slug,
    category: row.category,
    name: row.name,
    description: row.description,
    address: row.address,
    neighborhood: embeddedName(row.neighborhoods),
    comuna: embeddedName(row.comunas),
    comuna_code: row.comuna_code,
    phones: row.phones ?? [],
    hours: row.hours,
    source: row.source,
    status: row.status,
    verified_at: row.verified_at,
    freshness: resolveFreshness(row, now),
  };
}

const MAX_SEARCH_TOKENS = 6;
const MAX_TOKEN_LENGTH = 40;

export function toPrefixSearchQuery(raw: string): string | null {
  const tokens = raw
    .toLowerCase()
    .split(/[^0-9a-záéíóúüñ]+/)
    .filter((token) => token.length > 0)
    .slice(0, MAX_SEARCH_TOKENS)
    .map((token) => token.slice(0, MAX_TOKEN_LENGTH));

  if (tokens.length === 0) {
    return null;
  }

  return tokens.map((token) => `${token}:*`).join(" & ");
}

export async function listResources(
  filters: DirectoryFilters = {},
): Promise<DirectoryResource[]> {
  const supabase = createServerSupabaseClient();

  let request = supabase
    .from("info_resources")
    .select(LIST_COLUMNS)

    .eq("is_published", true);

  if (isResourceCategory(filters.category)) {
    request = request.eq("category", filters.category);
  }

  const comuna = filters.comuna?.trim();
  if (comuna) {
    request = request.eq("comuna_code", comuna);
  }

  const searchQuery = filters.query ? toPrefixSearchQuery(filters.query) : null;
  if (searchQuery) {
    request = request.textSearch("search_vector", searchQuery, {
      config: "spanish",
    });
  }

  const { data, error } = await request
    .order("name", { ascending: true })
    .limit(filters.limit ?? DEFAULT_LIST_LIMIT);

  if (error) {
    throw error;
  }

  const now = new Date();

  return ((data ?? []) as unknown as ResourceRow[]).map((row) =>
    toDirectoryResource(row, now),
  );
}

export async function getResourceBySlug(
  slug: string,
): Promise<ResourceDetail | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("info_resources")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as ResourceDetailRow;

  const photos = (row.info_resource_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((photo) => ({
      storagePath: photo.storage_path,
      caption: photo.caption,
    }));

  return {
    ...toDirectoryResource(row, new Date()),
    meeting_point: row.meeting_point,
    latitude: row.latitude,
    longitude: row.longitude,
    photos,
  };
}

/**
 * The hardcoded 123/119 numbers, confirmed against the directory when
 * possible so a stale or withdrawn entry doesn't get promoted to every
 * emergency-lines block in the app. Falls back to the raw hardcoded set on
 * any read failure — these numbers must never disappear because of an
 * unrelated query error.
 */
export async function getPriorityEmergencyLines(): Promise<
  readonly PriorityEmergencyLine[]
> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("info_resources")
      .select("phones")
      .overlaps(
        "phones",
        PRIORITY_EMERGENCY_LINES.map(({ phone }) => phone),
      )
      .eq("category", "lineas_atencion")
      .eq("is_published", true);

    if (error) {
      throw error;
    }

    const published = new Set(
      ((data ?? []) as Array<{ phones: string[] | null }>).flatMap(
        ({ phones }) => (phones ?? []).map(normalizePhoneText),
      ),
    );

    const stillPublished = PRIORITY_EMERGENCY_LINES.filter(({ phone }) =>
      published.has(normalizePhoneText(phone)),
    );

    if (stillPublished.length > 0) {
      return stillPublished;
    }
  } catch (error) {
    console.error("Unable to load emergency lines from the directory.", error);
  }

  return PRIORITY_EMERGENCY_LINES;
}

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
