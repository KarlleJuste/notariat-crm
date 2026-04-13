/**
 * Diagnostic chaîne MRR : Stripe → HubSpot → commercials → mrr_unattributed.
 * Usage : npm run debug:mrr
 */
import { readFileSync } from "fs";
import { join, resolve } from "path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const txt = readFileSync(envPath, "utf8");
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();

  const { listActiveSubscriptionsMrr } = await import("../lib/stripe");
  const {
    findContactIdByEmail,
    fetchDealIdsForContact,
    fetchDealWithContact,
  } = await import("../lib/hubspot");
  const { createClient } = await import("@supabase/supabase-js");

  console.log("=== a) Stripe — abonnements actifs ===\n");
  const subs = await listActiveSubscriptionsMrr();
  const withEmail = subs.filter((s) => s.customerEmail);
  const emails = withEmail.map((s) => s.customerEmail as string);
  console.log(`Nombre de subs actives : ${subs.length}`);
  console.log(`Avec email client : ${withEmail.length}`);
  console.log("3 premiers emails :", emails.slice(0, 3));

  console.log("\n=== b) c) d) HubSpot — premier email avec contact ===\n");
  const firstEmail = emails[0];
  if (!firstEmail) {
    console.log("Aucun email Stripe → arrêt chaîne HubSpot.");
  } else {
    const contactId = await findContactIdByEmail(firstEmail);
    console.log(`Contact HubSpot pour "${firstEmail}" :`, contactId ?? "null");
    if (contactId) {
      const dealIds = await fetchDealIdsForContact(contactId);
      console.log("Deal IDs associés au contact :", dealIds);
      if (dealIds.length > 0) {
        const deal = await fetchDealWithContact(dealIds[0]);
        console.log("Premier deal — hubspot_owner_id brut :", deal.hubspot_owner_id);
        console.log("Premier deal — stage (affiché) :", deal.stage);
      }
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const skey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("\n=== e) Supabase — commercials.hubspot_owner_id ===\n");
  if (!url || !skey) {
    console.log("Supabase URL / service role manquant.");
  } else {
    const admin = createClient(url, skey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: comms, error: eCom } = await admin
      .from("commercials")
      .select("id, name, hubspot_owner_id");
    if (eCom) console.log("Erreur :", eCom.message);
    else {
      const nullOwners = (comms ?? []).filter((c) => !c.hubspot_owner_id);
      console.log(
        `Commerciaux : ${comms?.length ?? 0} — sans hubspot_owner_id : ${nullOwners.length}`
      );
      console.table(
        (comms ?? []).map((c) => ({
          name: c.name,
          hubspot_owner_id: c.hubspot_owner_id ?? "NULL",
        }))
      );
    }

    console.log("\n=== f) mrr_unattributed par mois ===\n");
    const { data: unatt, error: eUn } = await admin
      .from("mrr_unattributed")
      .select("month, stripe_customer_email, amount_monthly");
    if (eUn) console.log("Erreur :", eUn.message);
    else {
      const byMonth = new Map<string, number>();
      for (const r of unatt ?? []) {
        const m = r.month as string;
        byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
      }
      const rows = [...byMonth.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, count]) => ({ month, rows: count }));
      console.table(rows);
      if ((unatt?.length ?? 0) > 0) {
        console.log(
          "→ La sync tourne mais l’attribution HubSpot → commercial échoue pour ces lignes."
        );
      }
    }
  }

  const hubKey = process.env.HUBSPOT_API_KEY;
  console.log("\n=== g) HubSpot — owners (pour remplir Équipe) ===\n");
  if (!hubKey) {
    console.log("HUBSPOT_API_KEY manquant.");
  } else {
    const res = await fetch(
      "https://api.hubapi.com/crm/v3/owners?limit=100&archived=false",
      { headers: { Authorization: `Bearer ${hubKey}` } }
    );
    if (!res.ok) {
      console.log("Erreur owners API :", res.status, await res.text());
    } else {
      const data = (await res.json()) as {
        results?: {
          id: string;
          email?: string;
          firstName?: string;
          lastName?: string;
        }[];
      };
      console.table(
        (data.results ?? []).map((o) => ({
          id: o.id,
          firstName: o.firstName ?? "",
          lastName: o.lastName ?? "",
          email: o.email ?? "",
        }))
      );
    }
  }

  console.log("\n=== h) Emails Stripe sans contact HubSpot (échantillon) ===\n");
  let noContact = 0;
  const samples: string[] = [];
  for (const s of withEmail.slice(0, 50)) {
    const em = s.customerEmail as string;
    const cid = await findContactIdByEmail(em);
    if (!cid) {
      noContact++;
      if (samples.length < 15) samples.push(em);
    }
  }
  console.log(
    `Vérifiés : ${Math.min(50, withEmail.length)} subs avec email — sans contact HS : ${noContact}`
  );
  if (samples.length) console.log("Exemples :", samples);

  console.log("\n=== Fin diagnostic ===\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
