import { NextResponse } from "next/server";
import {
  listEventIdsWithDemos,
  runHubSpotRefreshForEvent,
} from "@/lib/sync/hubspot-event-refresh";

export const runtime = "nodejs";

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Rafraîchit toutes les démos HubSpot (par événement).
 * Liste des événements : variable HUBSPOT_CRON_EVENT_IDS (UUIDs séparés par des virgules)
 * ou, si vide, tous les event_id qui ont au moins une démo active.
 */
export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const raw = process.env.HUBSPOT_CRON_EVENT_IDS?.trim();
  let eventIds: string[];
  if (raw) {
    eventIds = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    try {
      eventIds = await listEventIdsWithDemos();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur liste événements";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (eventIds.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "Aucun événement à synchroniser",
      events: [],
    });
  }

  const results: {
    eventId: string;
    ok: boolean;
    updated: number;
    failed: number;
    error?: string;
  }[] = [];

  for (const eventId of eventIds) {
    try {
      const { updates } = await runHubSpotRefreshForEvent(eventId);
      const failed = updates.filter((u) => !u.ok).length;
      results.push({
        eventId,
        ok: failed === 0,
        updated: updates.filter((u) => u.ok).length,
        failed,
      });
    } catch (e) {
      results.push({
        eventId,
        ok: false,
        updated: 0,
        failed: 0,
        error: e instanceof Error ? e.message : "Erreur",
      });
    }
  }

  const anyFail = results.some((r) => !r.ok);
  return NextResponse.json(
    {
      ok: !anyFail,
      eventsProcessed: results.length,
      results,
    },
    { status: 200 }
  );
}
