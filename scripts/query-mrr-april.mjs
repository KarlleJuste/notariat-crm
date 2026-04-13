#!/usr/bin/env node
/**
 * Stats MRR « avril » pour test — lit .env.local (service role).
 */
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(process.cwd());

function loadEnvLocal() {
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
}

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Supabase URL / service role manquant");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const APRIL_2026 = "2026-04-01";

async function main() {
  const { data: snaps, error: e1 } = await admin
    .from("mrr_snapshots")
    .select("commercial_id, mrr_amount, month, active_subscriptions")
    .eq("month", APRIL_2026);

  if (e1) throw e1;

  const { data: comms } = await admin
    .from("commercials")
    .select("id, name");
  const names = new Map((comms ?? []).map((c) => [c.id, c.name]));

  let snapTotal = 0;
  const byComm = [];
  for (const r of snaps ?? []) {
    const m = Number(r.mrr_amount ?? 0);
    snapTotal += m;
    byComm.push({
      commercial: names.get(r.commercial_id) ?? r.commercial_id,
      mrr: m,
      subs: r.active_subscriptions,
    });
  }

  const { data: demos, error: e2 } = await admin
    .from("demos")
    .select("stripe_mrr, is_churned, is_converted, commercial_id")
    .eq("is_archived", false)
    .eq("is_removed", false);

  if (e2) throw e2;

  let demosMrrNoChurn = 0;
  const byCommercialDemo = new Map();
  for (const d of demos ?? []) {
    if (d.is_churned) continue;
    const v = Number(d.stripe_mrr ?? 0);
    if (!v) continue;
    demosMrrNoChurn += v;
    const cid = d.commercial_id ?? "null";
    byCommercialDemo.set(cid, (byCommercialDemo.get(cid) ?? 0) + v);
  }

  const demosSinceApril = (demos ?? []).filter((d) => {
    if (d.is_churned) return false;
    const v = Number(d.stripe_mrr ?? 0);
    if (!v) return false;
    return true;
  });

  console.log(
    JSON.stringify(
      {
        note:
          "mrr_snapshots (avril) = agrégat Stripe au dernier sync pour le mois d’avril, par commercial. demos.stripe_mrr = MRR sur lignes démo non churn (peut doubler si plusieurs démos par client).",
        aprilMonthKey: APRIL_2026,
        mrr_snapshots_total_all_sales: Math.round(snapTotal * 100) / 100,
        mrr_snapshots_by_commercial: byComm.sort((a, b) => b.mrr - a.mrr),
        demos_stripe_mrr_sum_non_churn: Math.round(demosMrrNoChurn * 100) / 100,
        demos_stripe_mrr_by_commercial: [...byCommercialDemo.entries()].map(
          ([id, m]) => ({
            commercial: id === "null" ? "(non attribué)" : names.get(id) ?? id,
            mrr: Math.round(m * 100) / 100,
          })
        ),
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
