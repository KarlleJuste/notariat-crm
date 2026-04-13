#!/usr/bin/env node
/**
 * Lit scripts/cannes_2026_demos.csv → tri, dédoublonnage (email + commercial),
 * écrit scripts/cannes_2026_demos.clean.csv et scripts/cannes_2026_summary.json
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "cannes_2026_demos.csv");
const outCsv = join(__dirname, "cannes_2026_demos.clean.csv");
const outJson = join(__dirname, "cannes_2026_summary.json");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = [];
    let cur = "";
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQ = !inQ;
        continue;
      }
      if (!inQ && c === ",") {
        cells.push(cur.trim());
        cur = "";
        continue;
      }
      cur += c;
    }
    cells.push(cur.trim());
    const o = {};
    header.forEach((h, idx) => {
      o[h] = cells[idx] ?? "";
    });
    rows.push(o);
  }
  return { header, rows };
}

function toCsvRow(values) {
  return values
    .map((v) => {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(",");
}

const raw = readFileSync(src, "utf8");
const { header, rows } = parseCsv(raw);

const key = (r) =>
  `${(r.email || "").toLowerCase().trim()}|${(r.commercial || "").trim()}`;

const firstIdx = new Map();
rows.forEach((r, idx) => {
  const k = key(r);
  if (!firstIdx.has(k)) firstIdx.set(k, idx);
});

const unique = rows.filter((r, idx) => firstIdx.get(key(r)) === idx);

const dupes = rows
  .map((r, idx) => ({ r, idx }))
  .filter(({ r, idx }) => firstIdx.get(key(r)) !== idx)
  .map(({ r, idx }) => ({
    ligne: idx + 2,
    email: r.email,
    commercial: r.commercial,
    doublonDeLigne: firstIdx.get(key(r)) + 2,
  }));

unique.sort((a, b) => {
  const c = (a.commercial || "").localeCompare(b.commercial || "", "fr");
  if (c !== 0) return c;
  return (a.date_demo || "").localeCompare(b.date_demo || "");
});

const byCommercial = {};
for (const r of unique) {
  const name = (r.commercial || "—").trim();
  if (!byCommercial[name]) byCommercial[name] = { demoCount: 0, emails: [] };
  byCommercial[name].demoCount += 1;
  byCommercial[name].emails.push((r.email || "").toLowerCase());
}

const summary = {
  sourceFile: "cannes_2026_demos.csv",
  totalRowsInput: rows.length,
  uniqueRowsAfterDedupe: unique.length,
  duplicatesDropped: rows.length - unique.length,
  doublonsSupprimes: dupes,
  byCommercial: Object.fromEntries(
    Object.entries(byCommercial).map(([k, v]) => [
      k,
      { demoCount: v.demoCount, uniqueEmailCount: new Set(v.emails).size },
    ])
  ),
  mrrNote:
    "Ce CSV ne contient pas de montants d'abonnement. Le MRR réel vient de Stripe (sync) croisé avec l'email du contact / deal HubSpot. Les comptes ci-dessus sont un volume de démos par commercial, pas un MRR €.",
};

const outHeader = [
  ...header,
  "contact_complet",
].filter((h, i, a) => a.indexOf(h) === i);

const linesOut = [
  toCsvRow(outHeader),
  ...unique.map((r) => {
    const full = [r.prenom, r.nom].filter(Boolean).join(" ").trim();
    return toCsvRow([
      r.commercial,
      r.prenom,
      r.nom,
      r.email,
      r.date_reservation,
      r.date_demo,
      full,
    ]);
  }),
];

writeFileSync(outCsv, "\uFEFF" + linesOut.join("\n"), "utf8");
writeFileSync(outJson, JSON.stringify(summary, null, 2), "utf8");

console.log(JSON.stringify(summary, null, 2));
console.error(`\nÉcrit : ${outCsv}\nÉcrit : ${outJson}`);
