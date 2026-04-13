import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDealWithContact } from "@/lib/hubspot";

export type HubSpotRefreshUpdate = {
  id: string;
  ok: boolean;
  error?: string;
};

/**
 * Même logique que POST /api/hubspot/refresh pour un événement.
 * Met à jour stages, contacts, commercial_id (via hubspot_owner_id × table commercials).
 */
export async function runHubSpotRefreshForEvent(
  eventId: string
): Promise<{ updates: HubSpotRefreshUpdate[] }> {
  const admin = createAdminClient();

  const { data: demos } = await admin
    .from("demos")
    .select("id, hubspot_deal_id")
    .eq("event_id", eventId)
    .eq("is_removed", false);

  const { data: commercials } = await admin
    .from("commercials")
    .select("id, hubspot_owner_id");
  const ownerMap = new Map<string, string>();
  for (const c of commercials ?? []) {
    if (c.hubspot_owner_id) ownerMap.set(String(c.hubspot_owner_id), c.id);
  }

  const updates: HubSpotRefreshUpdate[] = [];

  for (const demo of demos ?? []) {
    try {
      const d = await fetchDealWithContact(demo.hubspot_deal_id);
      const commercialId = d.hubspot_owner_id
        ? ownerMap.get(String(d.hubspot_owner_id)) ?? null
        : null;
      const closeDate = d.close_date ? d.close_date.slice(0, 10) : null;

      await admin
        .from("demos")
        .update({
          commercial_id: commercialId,
          contact_email: d.contact_email,
          contact_name: d.contact_name,
          contact_company: d.contact_company,
          stage: d.stage,
          deal_name: d.deal_name,
          close_date: closeDate,
          raw_data: d.raw as object,
          is_archived: false,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", demo.id);

      updates.push({ id: demo.hubspot_deal_id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      const notFound = /introuvable|404/i.test(msg);
      if (notFound) {
        await admin
          .from("demos")
          .update({
            is_archived: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", demo.id);
      }
      updates.push({
        id: demo.hubspot_deal_id,
        ok: false,
        error: msg,
      });
    }
  }

  return { updates };
}

/** event_id distincts ayant au moins une démo non retirée */
export async function listEventIdsWithDemos(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("demos")
    .select("event_id")
    .eq("is_removed", false);
  if (error) throw new Error(error.message);
  const ids = Array.from(new Set((data ?? []).map((r) => r.event_id)));
  return ids;
}
