import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getServerProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventsPageClient } from "@/components/events/events-page-client";
import { EventsCommercialFilter } from "@/components/events/events-commercial-filter";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ commercial?: string }>;
}) {
  const { commercial } = await searchParams;
  const supabase = await createClient();
  const profile = await getServerProfile();
  const isManager = profile?.app_role === "manager";

  const { data: events } = await supabase
    .from("events")
    .select("id, name, type, date, location, status")
    .order("date", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);

  const { data: commercials } = await supabase
    .from("commercials")
    .select("id, name")
    .order("name");

  const { data: ecRows } =
    eventIds.length > 0
      ? await supabase
          .from("event_commercials")
          .select("event_id, commercial_id")
          .in("event_id", eventIds)
      : { data: [] };

  const commName = new Map(
    (commercials ?? []).map((c) => [c.id, c.name as string])
  );
  const commsByEvent = new Map<string, string[]>();
  for (const row of ecRows ?? []) {
    const n = commName.get(row.commercial_id);
    if (!n) continue;
    const arr = commsByEvent.get(row.event_id) ?? [];
    arr.push(n);
    commsByEvent.set(row.event_id, arr);
  }

  const { data: allDemos } =
    eventIds.length > 0
      ? await supabase
          .from("demos")
          .select("event_id, is_converted, stripe_mrr")
          .in("event_id", eventIds)
          .eq("is_archived", false)
          .eq("is_removed", false)
      : { data: [] };

  const statsByEvent = new Map<
    string,
    { booked: number; conv: number; mrr: number }
  >();
  for (const eid of eventIds) statsByEvent.set(eid, { booked: 0, conv: 0, mrr: 0 });
  for (const d of allDemos ?? []) {
    const s = statsByEvent.get(d.event_id);
    if (!s) continue;
    s.booked += 1;
    if (d.is_converted) s.conv += 1;
    s.mrr += Number(d.stripe_mrr ?? 0);
  }

  let displayEvents = events ?? [];
  if (isManager && commercial && commercial !== "all") {
    const allowed = new Set(
      (ecRows ?? [])
        .filter((r) => r.commercial_id === commercial)
        .map((r) => r.event_id)
    );
    displayEvents = displayEvents.filter((e) => allowed.has(e.id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Événements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Salons, congrès et webinars — suivi des démos et du MRR.
          </p>
        </div>
        {isManager && (
          <div className="flex flex-wrap items-end gap-4">
            <Suspense fallback={<div className="h-10 w-[200px] animate-pulse rounded-md bg-slate-100" />}>
              <EventsCommercialFilter commercials={commercials ?? []} />
            </Suspense>
            <EventsPageClient commercials={commercials ?? []} />
          </div>
        )}
      </div>

      <CardTable
        events={displayEvents}
        statsByEvent={statsByEvent}
        isManager={isManager}
        commsByEvent={commsByEvent}
      />
    </div>
  );
}

function CardTable({
  events,
  statsByEvent,
  isManager,
  commsByEvent,
}: {
  events: {
    id: string;
    name: string;
    type: string;
    date: string;
    location: string | null;
    status: string;
  }[];
  statsByEvent: Map<string, { booked: number; conv: number; mrr: number }>;
  isManager: boolean;
  commsByEvent: Map<string, string[]>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Lieu</TableHead>
            <TableHead>Commerciaux</TableHead>
            <TableHead>Démos</TableHead>
            <TableHead>Conv.</TableHead>
            <TableHead>MRR</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                Aucun événement. {isManager && "Créez le premier avec « Nouvel événement » ou élargissez le filtre commercial."}
              </TableCell>
            </TableRow>
          ) : (
            events.map((e) => {
              const st = statsByEvent.get(e.id) ?? {
                booked: 0,
                conv: 0,
                mrr: 0,
              };
              const rate = st.booked > 0 ? st.conv / st.booked : 0;
              const names = commsByEvent.get(e.id)?.join(", ") || "—";
              return (
                <TableRow key={e.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/events/${e.id}`}
                      className="text-indigo-700 hover:underline"
                    >
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {EVENT_TYPE_LABELS[e.type] ?? e.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell className="max-w-[140px] truncate text-slate-600">
                    {e.location ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-slate-600">
                    {names}
                  </TableCell>
                  <TableCell>{st.booked}</TableCell>
                  <TableCell>{formatPercent(rate, 0)}</TableCell>
                  <TableCell>{Math.round(st.mrr)} €</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {EVENT_STATUS_LABELS[e.status] ?? e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
