/**
 * Charge .env.local puis rafraîchit toutes les démos HubSpot (tous les événements).
 * Usage : npm run hubspot:refresh-all
 */
import { readFileSync } from "fs";
import { resolve } from "path";

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
  const { listEventIdsWithDemos, runHubSpotRefreshForEvent } = await import(
    "../lib/sync/hubspot-event-refresh"
  );

  const ids = await listEventIdsWithDemos();
  console.error(`${ids.length} événement(s) avec démos`);
  for (const id of ids) {
    const { updates } = await runHubSpotRefreshForEvent(id);
    const ok = updates.filter((u) => u.ok).length;
    const bad = updates.filter((u) => !u.ok).length;
    console.error(`  ${id} → ${ok} OK, ${bad} erreur(s)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
