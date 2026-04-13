import { NextResponse } from "next/server";
import { runStripeMrrSync } from "@/lib/sync/stripe-mrr";

export const runtime = "nodejs";

/**
 * Sync MRR / conversions Stripe → Supabase, sans session utilisateur.
 * Appelée par Vercel Cron (GET) ou tout scheduler avec le même secret.
 *
 * Headers : Authorization: Bearer <CRON_SECRET>
 */
function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await runStripeMrrSync();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, unattributedCount: result.unattributedCount },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    unattributedCount: result.unattributedCount,
  });
}
