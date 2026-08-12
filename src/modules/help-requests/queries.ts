import "server-only";

import { createServerSupabaseClient } from "@/shared/supabase/server";

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
