import type { createClient } from "@/lib/supabase/server";

export type DirectoryOrgRow = {
  id: string;
  name: string;
  short_name: string | null;
  type: string;
  region: string | null;
  city: string | null;
  crm_status: string;
  owner_commercial_id: string | null;
};

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** Charge les orgs avec filtres type (serveur), puis filtre texte q en mémoire — même logique page annuaire / export CSV. */
export async function loadDirectoryOrgs(
  supabase: ServerSupabase,
  q: string | undefined,
  type: string | undefined
): Promise<{ rows: DirectoryOrgRow[]; error: Error | null }> {
  let query = supabase
    .from("notary_orgs")
    .select(
      "id, name, short_name, type, region, city, crm_status, owner_commercial_id"
    )
    .order("name");

  if (type) {
    const types = type.split(",").filter(Boolean);
    if (types.length) query = query.in("type", types);
  }

  const { data: orgs, error } = await query;
  if (error) {
    return { rows: [], error: new Error(error.message) };
  }

  let rows = (orgs ?? []) as DirectoryOrgRow[];
  const qq = q?.trim().toLowerCase();
  if (qq) {
    rows = rows.filter(
      (o) =>
        o.name.toLowerCase().includes(qq) ||
        (o.short_name && o.short_name.toLowerCase().includes(qq)) ||
        (o.city && o.city.toLowerCase().includes(qq))
    );
  }

  return { rows, error: null };
}

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
