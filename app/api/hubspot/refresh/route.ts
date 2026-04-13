import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runHubSpotRefreshForEvent } from "@/lib/sync/hubspot-event-refresh";

const bodySchema = z.object({
  event_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_role")
    .eq("id", user.id)
    .single();

  if (profile?.app_role !== "manager") {
    return NextResponse.json({ error: "Accès réservé aux managers" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "event_id requis" }, { status: 400 });
  }

  const { updates } = await runHubSpotRefreshForEvent(parsed.data.event_id);
  return NextResponse.json({ updates });
}
