import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getServerProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";
import { isDemoRealizedPastBooking } from "@/lib/demo-stage";
import { EventDetailActions } from "@/components/events/event-detail-actions";
import { EventNotes } from "@/components/events/event-notes";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getServerProfile();
  const isManager = profile?.app_role === "manager";

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: ecRows } = await supabase
    .from("event_commercials")
    .select("commercial_id")
    .eq("event_id", id);

  const { data: allComms } = await supabase
    .from("commercials")
    .select("id, name, avatar_url");

  const commMap = new Map(
    (allComms ?? []).map((c) => [c.id, { name: c.name, avatar_url: c.avatar_url }])
  );

  const assignedComms = (ecRows ?? [])
    .map((r) => commMap.get(r.commercial_id))
    .filter((x): x is { name: string; avatar_url: string | null } => !!x);

  const { data: demosRaw } = await supabase
    .from("demos")
    .select(
      "id, hubspot_deal_id, deal_name, contact_name, contact_company, stage, is_converted, stripe_mrr, commercial_id"
    )
    .eq("event_id", id)
    .eq("is_archived", false)
    .eq("is_removed", false)
    .order("created_at", { ascending: false });

  const demos =
    demosRaw?.map((d) => ({
      ...d,
      commercials: d.commercial_id
        ? commMap.get(d.commercial_id) ?? null
        : null,
    })) ?? [];

  const booked = demos?.length ?? 0;
  const realized =
    demos?.filter((d) => isDemoRealizedPastBooking(d.stage)).length ?? 0;
  const conv = demos?.filter((d) => d.is_converted).length ?? 0;
  const mrr =
    demos?.reduce((s, d) => s + Number(d.stripe_mrr ?? 0), 0) ?? 0;
  const rate = booked > 0 ? conv / booked : 0;

  const portal = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/events"
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Événements
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {event.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {EVENT_TYPE_LABELS[event.type] ?? event.type}
            </Badge>
            <span className="text-sm text-slate-600">{event.date}</span>
            {event.location && (
              <span className="text-sm text-slate-500">{event.location}</span>
            )}
            <Badge variant="secondary">
              {EVENT_STATUS_LABELS[event.status] ?? event.status}
            </Badge>
          </div>
          {assignedComms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {assignedComms.map((c) => (
                <Badge key={c.name} variant="secondary">
                  {c.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {isManager && (
          <EventDetailActions
            eventId={id}
            event={{
              id: event.id,
              name: event.name,
              type: event.type,
              date: event.date,
              location: event.location,
              status: event.status,
              notes: event.notes,
            }}
            commercials={(allComms ?? []).map((c) => ({
              id: c.id,
              name: c.name,
            }))}
            assignedCommercialIds={(ecRows ?? []).map((r) => r.commercial_id)}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Démos bookées", value: String(booked) },
          { label: "Réalisées / actives", value: String(realized) },
          { label: "Conversions", value: String(conv) },
          { label: "Taux conversion", value: formatPercent(rate, 0) },
          { label: "MRR généré", value: `${Math.round(mrr)} €` },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">
                {k.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-slate-900">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isManager ? (
        <EventNotes eventId={id} initialNotes={event.notes} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Debrief / notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {event.notes?.trim() ? event.notes : "Aucune note."}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Démos liées</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Commercial</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Converti</TableHead>
                <TableHead>HubSpot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(demos ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    Aucune démo. {isManager && "Ajoutez des IDs de deals HubSpot."}
                  </TableCell>
                </TableRow>
              ) : (
                (demos ?? []).map((d) => {
                  const hubUrl =
                    portal &&
                    `https://app.hubspot.com/contacts/${portal}/record/0-3/${d.hubspot_deal_id}`;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {d.contact_name ?? d.deal_name ?? "—"}
                      </TableCell>
                      <TableCell>{d.contact_company ?? "—"}</TableCell>
                      <TableCell>{d.commercials?.name ?? "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-600">
                        {d.stage ?? "—"}
                      </TableCell>
                      <TableCell>
                        {d.is_converted ? (
                          <Badge variant="success">Oui</Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hubUrl ? (
                          <a
                            href={hubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            Ouvrir
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-slate-500">
                            {d.hubspot_deal_id}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
