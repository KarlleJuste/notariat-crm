#!/usr/bin/env node
/**
 * Importe les deals HubSpot (fichier scripts/output/event-cannes-hubspot-match.json)
 * dans l'événement « Congrès Notaires Cannes (mars 2026) ».
 *
 * - Supprime les démos existantes pour cet événement (remplacement complet).
 * - Une ligne par deal HubSpot unique (doublons email → même deal ignorés).
 * - Renseigne commercial_id via hubspot_owner_id du deal + table commercials.
 *
 * Prérequis : .env.local avec NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HUBSPOT_API_KEY
 */
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MATCH_JSON = join(__dirname, "output", "event-cannes-hubspot-match.json");
const HUBSPOT_BASE = "https://api.hubapi.com";
const EVENT_NAME = "Congrès Notaires Cannes (mars 2026)";

function loadEnvLocal() {
  try {
    const txt = readFileSync(join(ROOT, ".env.local"), "utf8");
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
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}

async function batchReadDealOwners(token, dealIds) {
  const map = new Map();
  const props = ["hubspot_owner_id", "dealname", "dealstage", "closedate"];
  const chunkSize = 100;
  for (let c = 0; c < dealIds.length; c += chunkSize) {
    const chunk = dealIds.slice(c, c + chunkSize);
    const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/deals/batch/read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: props,
        inputs: chunk.map((id) => ({ id })),
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HubSpot batch read ${res.status}: ${txt.slice(0, 400)}`);
    }
    const data = await res.json();
    for (const r of data.results ?? []) {
      map.set(r.id, r.properties ?? {});
    }
  }
  return map;
}

function contactDisplayName(prenom, nom) {
  const a = (prenom || "").trim();
  const b = (nom || "").trim();
  return [a, b].filter(Boolean).join(" ") || null;
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hubToken = process.env.HUBSPOT_API_KEY;
  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
    process.exit(1);
  }
  if (!hubToken) {
    console.error("HUBSPOT_API_KEY manquant");
    process.exit(1);
  }

  const raw = readFileSync(MATCH_JSON, "utf8");
  const { rows } = JSON.parse(raw);

  const byDeal = new Map();
  for (const r of rows) {
    const did = r.recommended_deal_id;
    if (!did) continue;
    if (!byDeal.has(did)) {
      byDeal.set(did, r);
    }
  }

  const dealIds = [...byDeal.keys()];
  console.error(`Deals uniques à importer : ${dealIds.length}`);

  const hubProps = await batchReadDealOwners(hubToken, dealIds);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: event, error: evErr } = await admin
    .from("events")
    .select("id")
    .eq("name", EVENT_NAME)
    .maybeSingle();

  if (evErr) throw evErr;

  let eventId = event?.id;
  if (!eventId) {
    const { data: inserted, error: insEv } = await admin
      .from("events")
      .insert({
        name: EVENT_NAME,
        type: "salon_congres",
        date: "2026-03-22",
        location: "Cannes",
        status: "termine",
        notes:
          "Démos importées depuis matching CSV × HubSpot (scripts/import-cannes-hubspot-demos.mjs).",
      })
      .select("id")
      .single();
    if (insEv) throw insEv;
    eventId = inserted.id;
    console.error("Événement créé :", eventId);

    const { data: comms } = await admin
      .from("commercials")
      .select("id, name")
      .in("name", ["Karl", "Juliette", "Quentin"]);
    const ecRows = (comms ?? []).map((c) => ({
      event_id: eventId,
      commercial_id: c.id,
    }));
    if (ecRows.length) {
      const { error: ecErr } = await admin.from("event_commercials").insert(ecRows);
      if (ecErr) throw ecErr;
      console.error(`event_commercials : ${ecRows.length} liaisons`);
    }
  } else {
    console.error("Événement existant :", eventId);
  }

  const { data: commercials } = await admin
    .from("commercials")
    .select("id, hubspot_owner_id");
  const ownerToCommercial = new Map();
  for (const c of commercials ?? []) {
    if (c.hubspot_owner_id)
      ownerToCommercial.set(String(c.hubspot_owner_id), c.id);
  }

  const { error: delErr } = await admin.from("demos").delete().eq("event_id", eventId);
  if (delErr) throw delErr;
  console.error("Anciennes démos Cannes supprimées pour cet event_id.");

  const toInsert = [];
  for (const dealId of dealIds) {
    const r = byDeal.get(dealId);
    const hp = hubProps.get(dealId) || {};
    const ownerHs = hp.hubspot_owner_id
      ? String(hp.hubspot_owner_id)
      : null;
    const commercialId = ownerHs
      ? ownerToCommercial.get(ownerHs) ?? null
      : null;

    let closeDate = hp.closedate ? String(hp.closedate).slice(0, 10) : null;
    if (closeDate === "" || closeDate === "null") closeDate = null;

    toInsert.push({
      hubspot_deal_id: dealId,
      event_id: eventId,
      commercial_id: commercialId,
      contact_email: (r.email || "").toLowerCase().trim() || null,
      contact_name: contactDisplayName(r.prenom, r.nom),
      contact_company: (r.etude || "").trim() || null,
      deal_name: hp.dealname || r.recommended_deal_name || null,
      stage: hp.dealstage || r.recommended_stage || null,
      close_date: closeDate,
      raw_data: {
        source: "import_cannes_hubspot_match",
        hubspot_contact_id: r.hubspot_contact_id,
        csv_line: r.ligne,
      },
      is_archived: false,
      is_removed: false,
      synced_at: new Date().toISOString(),
    });
  }

  const chunk = 40;
  for (let i = 0; i < toInsert.length; i += chunk) {
    const part = toInsert.slice(i, i + chunk);
    const { error: insErr } = await admin.from("demos").insert(part);
    if (insErr) throw insErr;
    console.error(`Inséré ${Math.min(i + chunk, toInsert.length)} / ${toInsert.length}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        eventId,
        eventName: EVENT_NAME,
        demosInserted: toInsert.length,
        skippedNoDeal: rows.filter((r) => !r.recommended_deal_id).length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
