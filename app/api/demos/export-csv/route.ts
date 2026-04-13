import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvEscape } from "@/lib/directory-query";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const eventId = searchParams.get("event_id");
  if (!eventId) {
    return NextResponse.json({ error: "event_id manquant" }, { status: 400 });
  }

  // Récupère le nom de l'événement pour le nom du fichier
  const { data: event } = await supabase
    .from("events")
    .select("name, date")
    .eq("id", eventId)
    .single();

  // Récupère toutes les démos de l'événement
  const { data: demos, error } = await supabase
    .from("demos")
    .select(
      "deal_name, contact_name, contact_company, contact_email, stage, is_converted, is_churned, stripe_mrr, created_at, commercial_id, hubspot_deal_id"
    )
    .eq("event_id", eventId)
    .eq("is_archived", false)
    .eq("is_removed", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Récupère les noms des commerciaux
  const { data: commercials } = await supabase
    .from("commercials")
    .select("id, name");

  const commName = new Map(
    (commercials ?? []).map((c) => [c.id, c.name as string])
  );

  const header = [
    "Deal",
    "Contact",
    "Entreprise",
    "Email",
    "Stage HubSpot",
    "Converti",
    "Churné",
    "MRR Stripe (€)",
    "Commercial",
    "HubSpot Deal ID",
    "Date création",
  ];

  const lines = [header.join(",")];

  for (const d of demos ?? []) {
    const line = [
      csvEscape(d.deal_name ?? ""),
      csvEscape(d.contact_name ?? ""),
      csvEscape(d.contact_company ?? ""),
      csvEscape(d.contact_email ?? ""),
      csvEscape(d.stage ?? ""),
      d.is_converted ? "Oui" : "Non",
      d.is_churned ? "Oui" : "Non",
      String(d.stripe_mrr ?? 0),
      csvEscape(d.commercial_id ? (commName.get(d.commercial_id) ?? "") : ""),
      csvEscape(d.hubspot_deal_id ?? ""),
      d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : "",
    ].join(",");
    lines.push(line);
  }

  const body = "\uFEFF" + lines.join("\n");

  const eventSlug = event
    ? `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${event.date ?? "date"}`
    : `event-${eventId.slice(0, 8)}`;
  const filename = `demos_${eventSlug}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
