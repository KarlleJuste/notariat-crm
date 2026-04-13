#!/usr/bin/env node
/**
 * Associe un CSV (Email, Prénom, Nom, Étude) aux contacts + deals HubSpot.
 * Usage :
 *   node scripts/hubspot-match-event-contacts.mjs "/chemin/vers/fichier.csv"
 *
 * Charge HUBSPOT_API_KEY depuis .env.local à la racine du projet.
 * Sorties dans scripts/output/ : JSON, CSV, liste d'IDs deals (une ligne = un deal unique).
 */
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(__dirname, "output");
const HUBSPOT_BASE = "https://api.hubapi.com";

const DEFAULT_CSV =
  process.argv[2] ||
  join(
    process.env.HOME || "",
    "Downloads",
    "EVENT CANNES - Sheet1.csv"
  );

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

/** Parse CSV avec champs entre guillemets */
function parseCsvRows(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function readRow() {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    while (i < len) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            cur += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        cur += c;
        i++;
        continue;
      }
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ",") {
        cells.push(cur.trim());
        cur = "";
        i++;
        continue;
      }
      if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        i++;
        cells.push(cur.trim());
        return cells;
      }
      cur += c;
      i++;
    }
    if (cur.length || cells.length) cells.push(cur.trim());
    return cells.length ? cells : null;
  }

  let header = null;
  while (i < len) {
    if (text[i] === "\r" || text[i] === "\n") {
      i++;
      continue;
    }
    const lineStart = i;
    const row = readRow();
    if (!row || row.every((c) => !c)) continue;
    if (!header) {
      header = row.map((h) => h.trim());
      continue;
    }
    const o = {};
    header.forEach((h, idx) => {
      o[h] = row[idx] ?? "";
    });
    rows.push(o);
  }
  return { header, rows };
}

function normalizeHeader(h) {
  const k = h.toLowerCase().replace(/\s+/g, "_");
  if (k.includes("email")) return "email";
  if (k === "prénom" || k === "prenom") return "prenom";
  if (k === "nom") return "nom";
  if (k === "etude" || k === "étude") return "etude";
  return h;
}

async function findContactIdByEmail(token, email) {
  const em = email.toLowerCase().trim();
  if (!em) return null;
  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: "email", operator: "EQ", value: em },
        ],
      },
    ],
    properties: ["email", "firstname", "lastname", "company"],
    limit: 1,
  };
  const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HubSpot search ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.results?.[0]?.id ?? null;
}

async function fetchDealIdsForContact(token, contactId) {
  const res = await fetch(
    `${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((r) => r.id);
}

async function batchReadDeals(token, ids) {
  if (!ids.length) return new Map();
  const props = [
    "dealname",
    "dealstage",
    "closedate",
    "createdate",
    "hubspot_owner_id",
    "hs_is_closed",
  ].join(",");
  const map = new Map();
  const chunkSize = 100;
  for (let c = 0; c < ids.length; c += chunkSize) {
    const chunk = ids.slice(c, c + chunkSize);
    const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/deals/batch/read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: props.split(","),
        inputs: chunk.map((id) => ({ id })),
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HubSpot batch deals ${res.status}: ${t.slice(0, 300)}`);
    }
    const data = await res.json();
    for (const r of data.results ?? []) {
      map.set(r.id, r.properties ?? {});
    }
  }
  return map;
}

function pickPreferredDeal(dealIds, dealPropsMap) {
  if (!dealIds.length) return null;
  const scored = dealIds.map((id) => {
    const p = dealPropsMap.get(id) || {};
    const closed = p.hs_is_closed === "true" || p.hs_is_closed === true;
    const created = p.createdate ? Number(p.createdate) : 0;
    return { id, closed, created, name: p.dealname || "" };
  });
  scored.sort((a, b) => {
    if (a.closed !== b.closed) return a.closed ? 1 : -1;
    return b.created - a.created;
  });
  return scored[0]?.id ?? dealIds[0];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnvLocal();
  const token = process.env.HUBSPOT_API_KEY;
  if (!token) {
    console.error("HUBSPOT_API_KEY manquant (.env.local)");
    process.exit(1);
  }

  const csvPath = resolve(DEFAULT_CSV);
  let raw;
  try {
    raw = readFileSync(csvPath, "utf8");
  } catch (e) {
    console.error("Fichier introuvable :", csvPath);
    console.error(e.message);
    process.exit(1);
  }

  const { rows: rawRows } = parseCsvRows(raw);
  const rows = rawRows.map((r) => {
    const keys = Object.keys(r);
    const norm = {};
    for (const k of keys) {
      norm[normalizeHeader(k)] = r[k];
    }
    return {
      email: (norm.email || "").trim(),
      prenom: norm.prenom || "",
      nom: norm.nom || "",
      etude: norm.etude || "",
    };
  }).filter((r) => r.email);

  mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  const allDealIds = new Set();

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    process.stderr.write(`\r${idx + 1}/${rows.length} ${r.email.slice(0, 40)}…   `);
    let contactId = null;
    let error = null;
    try {
      contactId = await findContactIdByEmail(token, r.email);
      await sleep(120);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    let dealIds = [];
    if (contactId && !error) {
      try {
        dealIds = await fetchDealIdsForContact(token, contactId);
        await sleep(80);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }

    dealIds.forEach((id) => allDealIds.add(id));

    results.push({
      ligne: idx + 2,
      ...r,
      hubspot_contact_id: contactId,
      hubspot_deal_ids: dealIds,
      hubspot_error: error,
    });
  }

  process.stderr.write("\n");

  const dealPropsMap = await batchReadDeals(token, [...allDealIds]);

  for (const row of results) {
    const ids = row.hubspot_deal_ids;
    row.recommended_deal_id =
      ids.length === 0
        ? null
        : pickPreferredDeal(ids, dealPropsMap);
    row.recommended_deal_name = row.recommended_deal_id
      ? dealPropsMap.get(row.recommended_deal_id)?.dealname ?? null
      : null;
    row.recommended_stage = row.recommended_deal_id
      ? dealPropsMap.get(row.recommended_deal_id)?.dealstage ?? null
      : null;
  }

  const unmatchedContact = results.filter((x) => !x.hubspot_contact_id);
  const noDeals = results.filter(
    (x) => x.hubspot_contact_id && x.hubspot_deal_ids.length === 0
  );
  const ok = results.filter((x) => x.recommended_deal_id);

  const uniqueDealIds = [...new Set(results.map((r) => r.recommended_deal_id).filter(Boolean))];

  const summary = {
    sourceCsv: csvPath,
    totalRows: results.length,
    matchedContact: results.length - unmatchedContact.length,
    unmatchedContactCount: unmatchedContact.length,
    contactsWithNoDeals: noDeals.length,
    rowsWithRecommendedDeal: ok.length,
    uniqueRecommendedDeals: uniqueDealIds.length,
    dashboardNote:
      "Le dashboard (événement, pipeline, MRR) s’alimente après import des hubspot_deal_id dans l’événement Cannes puis « Rafraîchir HubSpot » et sync Stripe. Le MRR € ne sort pas de ce CSV : il vient des abonnements Stripe rattachés par email.",
    unmatchedEmails: unmatchedContact.map((x) => x.email),
    contactsWithoutDeals: noDeals.map((x) => x.email),
  };

  const jsonPath = join(OUT_DIR, "event-cannes-hubspot-match.json");
  writeFileSync(
    jsonPath,
    JSON.stringify({ summary, rows: results }, null, 2),
    "utf8"
  );

  const csvOut = [
    [
      "email",
      "prenom",
      "nom",
      "etude",
      "hubspot_contact_id",
      "nb_deals",
      "recommended_deal_id",
      "recommended_deal_name",
      "recommended_stage",
      "all_deal_ids",
    ].join(","),
    ...results.map((x) =>
      [
        csvEscape(x.email),
        csvEscape(x.prenom),
        csvEscape(x.nom),
        csvEscape(x.etude),
        x.hubspot_contact_id || "",
        String(x.hubspot_deal_ids.length),
        x.recommended_deal_id || "",
        csvEscape(x.recommended_deal_name || ""),
        csvEscape(x.recommended_stage || ""),
        csvEscape(x.hubspot_deal_ids.join(";")),
      ].join(",")
    ),
  ].join("\n");
  writeFileSync(
    join(OUT_DIR, "event-cannes-hubspot-match.csv"),
    "\uFEFF" + csvOut,
    "utf8"
  );

  writeFileSync(
    join(OUT_DIR, "event-cannes-deal-ids-one-per-line.txt"),
    uniqueDealIds.join("\n") + "\n",
    "utf8"
  );

  console.log(JSON.stringify(summary, null, 2));
  console.error("\nFichiers écrits dans", OUT_DIR);
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
