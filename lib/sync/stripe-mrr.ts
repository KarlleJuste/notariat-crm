import { createAdminClient } from "@/lib/supabase/admin";
import {
  findContactIdByEmail,
  fetchDealIdsForContact,
  fetchDealHubspotOwnerId,
} from "@/lib/hubspot";
import { listActiveSubscriptionsMrr } from "@/lib/stripe";

function monthStart(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  return x.toISOString().slice(0, 10);
}

/**
 * Synchronise MRR Stripe, tableaux d’attribution et conversions démos.
 * À appeler depuis la route API ou une Edge Function (clé service).
 */
export async function runStripeMrrSync(): Promise<{
  ok: boolean;
  error?: string;
  unattributedCount: number;
}> {
  try {
    const admin = createAdminClient();
    const month = monthStart();

    await admin.from("mrr_unattributed").delete().eq("month", month);

    const subs = await listActiveSubscriptionsMrr();
    const emailToSub = new Map<string, (typeof subs)[0]>();
    for (const s of subs) {
      const em = s.customerEmail?.toLowerCase().trim();
      if (em) emailToSub.set(em, s);
    }

    const { data: commercials } = await admin.from("commercials").select("id, hubspot_owner_id");
    const ownerToCommercial = new Map<string, string>();
    for (const c of commercials ?? []) {
      if (c.hubspot_owner_id)
        ownerToCommercial.set(String(c.hubspot_owner_id), c.id);
    }

    const totals = new Map<string, { mrr: number; subs: number }>();

    for (const sub of subs) {
      const email = sub.customerEmail?.toLowerCase().trim();
      if (!email) {
        await admin.from("mrr_unattributed").upsert(
          {
            stripe_subscription_id: sub.subscriptionId,
            stripe_customer_email: null,
            amount_monthly: sub.amountMonthly,
            month,
          },
          { onConflict: "stripe_subscription_id,month" }
        );
        continue;
      }

      const contactId = await findContactIdByEmail(email);
      if (!contactId) {
        await admin.from("mrr_unattributed").upsert(
          {
            stripe_subscription_id: sub.subscriptionId,
            stripe_customer_email: email,
            amount_monthly: sub.amountMonthly,
            month,
          },
          { onConflict: "stripe_subscription_id,month" }
        );
        continue;
      }

      const dealIds = await fetchDealIdsForContact(contactId);
      let commercialId: string | null = null;
      for (const did of dealIds) {
        const oid = await fetchDealHubspotOwnerId(did);
        if (oid && ownerToCommercial.has(oid)) {
          commercialId = ownerToCommercial.get(oid) ?? null;
          break;
        }
      }

      if (!commercialId) {
        await admin.from("mrr_unattributed").upsert(
          {
            stripe_subscription_id: sub.subscriptionId,
            stripe_customer_email: email,
            amount_monthly: sub.amountMonthly,
            month,
          },
          { onConflict: "stripe_subscription_id,month" }
        );
        continue;
      }

      const cur = totals.get(commercialId) ?? { mrr: 0, subs: 0 };
      cur.mrr += sub.amountMonthly;
      cur.subs += 1;
      totals.set(commercialId, cur);
    }

    await Promise.all(
      Array.from(totals.entries()).map(([commercialId, v]) =>
        admin.from("mrr_snapshots").upsert(
          {
            commercial_id: commercialId,
            month,
            mrr_amount: Math.round(v.mrr * 100) / 100,
            active_subscriptions: v.subs,
            calculated_at: new Date().toISOString(),
          },
          { onConflict: "commercial_id,month" }
        )
      )
    );

    const { data: demos } = await admin
      .from("demos")
      .select("id, contact_email, stage, is_converted, stripe_subscription_id")
      .eq("is_archived", false)
      .eq("is_removed", false);

    const activeEmails = new Set(emailToSub.keys());

    for (const demo of demos ?? []) {
      const em = demo.contact_email?.toLowerCase().trim();
      if (!em) continue;
      const sub = emailToSub.get(em);
      const hasActive = activeEmails.has(em);
      const stageChurned = (demo.stage ?? "").toLowerCase().includes("churn");

      const isConverted = hasActive && !!sub;
      const wasConverted = demo.is_converted === true || !!demo.stripe_subscription_id;
      const isChurned = stageChurned || (wasConverted && !hasActive);

      await admin
        .from("demos")
        .update({
          is_converted: isConverted,
          is_churned: isChurned,
          stripe_subscription_id: hasActive && sub ? sub.subscriptionId : null,
          stripe_mrr: hasActive && sub ? sub.amountMonthly : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", demo.id);
    }

    const { count } = await admin
      .from("mrr_unattributed")
      .select("*", { count: "exact", head: true })
      .eq("month", month);

    return { ok: true, unattributedCount: count ?? 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur sync";
    return { ok: false, error: msg, unattributedCount: 0 };
  }
}
