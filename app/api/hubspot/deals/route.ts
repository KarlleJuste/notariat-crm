import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDealWithContact } from "@/lib/hubspot";

const bodySchema = z.object({
  event_id: z.string().uuid(),
  deal_ids: z.array(z.string().min(1)).min(1),
});

function parseDealIds(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("id", user.id)
    .single();

  if (profile?.app_role !== "manager") {
    return NextResponse.json({ error: "Accès réservé aux managers" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { event_id } = parsed.data;
  let deal_ids = parsed.data.deal_ids.flatMap((id) => parseDealIds(id));
  deal_ids = Array.from(new Set(deal_ids));

  const admin = createAdminClient();

  const { data: commercials } = await admin
    .from("commercials")
    .select("id, hubspot_owner_id");

  const ownerMap = new Map<string, string>();
  for (const c of commercials ?? []) {
    if (c.hubspot_owner_id) ownerMap.set(String(c.hubspot_owner_id), c.id);
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const dealId of deal_ids) {
    try {
      const d = await fetchDealWithContact(dealId);
      const commercialId = d.hubspot_owner_id
        ? ownerMap.get(String(d.hubspot_owner_id)) ?? null
        : null;

      const closeDate = d.close_date
        ? d.close_date.slice(0, 10)
        : null;

      const { error } = await admin.from("demos").upsert(
        {
          hubspot_deal_id: d.hubspot_deal_id,
          event_id,
          commercial_id: commercialId,
          contact_email: d.contact_email,
          contact_name: d.contact_name,
          contact_company: d.contact_company,
          stage: d.stage,
          deal_name: d.deal_name,
          close_date: closeDate,
          raw_data: d.raw as object,
          is_archived: false,
          is_removed: false,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "hubspot_deal_id" }
      );

      if (error) {
        results.push({ id: dealId, ok: false, error: error.message });
      } else {
        results.push({ id: dealId, ok: true });
      }
    } catch (e) {
      results.push({
        id: dealId,
        ok: false,
        error: e instanceof Error ? e.message : "Erreur HubSpot",
      });
    }
  }

  return NextResponse.json({ results });
}
