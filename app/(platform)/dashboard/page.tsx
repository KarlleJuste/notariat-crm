import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getServerProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyEUR, formatPercent } from "@/lib/utils";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export default async function DashboardPage() {
  const profile = await getServerProfile();
  if (!profile || profile.app_role !== "manager") {
    redirect("/events");
  }

  const supabase = await createClient();

  // ── Tous les events (récents en premier) ────────────────────────────────
  const { data: events } = await supabase
    .from("events")
    .select("id, name, date, status")
    .order("date", { ascending: false });

  // ── Toutes les démos actives (event_id + stats) ──────────────────────────
  const { data: allDemos } = await supabase
    .from("demos")
    .select("event_id, stripe_mrr, is_converted")
    .eq("is_archived", false)
    .eq("is_removed", false);

  const { data: lastHubspotSync } = await supabase
    .from("demos")
    .select("synced_at")
    .eq("is_removed", false)
    .not("synced_at", "is", null)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Aggrégation par événement
  const eventStats = new Map<
    string,
    { total: number; converted: number; mrr: number }
  >();
  for (const d of allDemos ?? []) {
    const s = eventStats.get(d.event_id) ?? { total: 0, converted: 0, mrr: 0 };
    s.total += 1;
    if (d.is_converted) {
      s.converted += 1;
      s.mrr += Number(d.stripe_mrr ?? 0);
    }
    eventStats.set(d.event_id, s);
  }

  // ── KPIs globaux ─────────────────────────────────────────────────────────
  const statsArr = Array.from(eventStats.values());
  const totalMrr = statsArr.reduce((s, e) => s + e.mrr, 0);
  const totalDemos = statsArr.reduce((s, e) => s + e.total, 0);
  const totalConverted = statsArr.reduce((s, e) => s + e.converted, 0);
  const convRate = totalDemos > 0 ? totalConverted / totalDemos : 0;
  const eventsTermine = (events ?? []).filter((e) => e.status === "termine").length;

  // ── Données graphique (8 derniers events) ────────────────────────────────
  const chartEvents = (events ?? []).slice(0, 8).reverse();
  const eventData = chartEvents.map((e) => {
    const s = eventStats.get(e.id) ?? { total: 0, converted: 0, mrr: 0 };
    return {
      name: e.name.slice(0, 16),
      demos: s.total,
      converted: s.converted,
      mrr: s.mrr,
    };
  });

  // ── Table : à venir + terminés ────────────────────────────────────────────
  const upcoming = (events ?? []).filter((e) => e.status === "a_venir").slice(0, 4);
  const completed = (events ?? []).filter((e) => e.status === "termine").slice(0, 4);
  const tableEvents = [...upcoming, ...completed];

  const hubspotSyncLabel = lastHubspotSync?.synced_at
    ? format(new Date(lastHubspotSync.synced_at), "d MMM yyyy à HH:mm", {
        locale: fr,
      })
    : null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          MRR et démos issus des événements commerciaux.
        </p>
        <p className="mt-3 text-xs text-slate-600">
          <span className="text-slate-500">Dernière synchro HubSpot :</span>{" "}
          <span className="font-medium text-slate-800">
            {hubspotSyncLabel ?? "aucune enregistrée"}
          </span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-transform hover:scale-[1.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              MRR total généré (events)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrencyEUR(totalMrr)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              sur toutes les démos converties
            </p>
          </CardContent>
        </Card>

        <Card className="transition-transform hover:scale-[1.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Démos bookées (total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{totalDemos}</p>
            <p className="mt-1 text-xs text-slate-500">
              {totalConverted} converties
            </p>
          </CardContent>
        </Card>

        <Card className="transition-transform hover:scale-[1.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Taux de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatPercent(convRate, 1)}
            </p>
            <p className="mt-1 text-xs text-slate-500">toutes périodes</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/40 transition-transform hover:scale-[1.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">
              Événements terminés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-950">{eventsTermine}</p>
            <p className="mt-1 text-xs text-indigo-600">
              {(events ?? []).filter((e) => e.status === "a_venir").length} à venir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts eventData={eventData} />

      {/* Table événements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Événements à venir &amp; terminés (récents)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Démos</TableHead>
                <TableHead className="text-right">Convertis</TableHead>
                <TableHead className="text-right">MRR généré</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    Aucun événement.{" "}
                    <Link href="/events" className="text-indigo-600 underline">
                      Créez-en un
                    </Link>
                    .
                  </TableCell>
                </TableRow>
              ) : (
                tableEvents.map((e) => {
                  const s = eventStats.get(e.id) ?? {
                    total: 0,
                    converted: 0,
                    mrr: 0,
                  };
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/events/${e.id}`}
                          className="hover:text-indigo-600 hover:underline"
                        >
                          {e.name}
                        </Link>
                      </TableCell>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {EVENT_STATUS_LABELS[e.status] ?? e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{s.total}</TableCell>
                      <TableCell className="text-right">{s.converted}</TableCell>
                      <TableCell className="text-right font-medium">
                        {s.mrr > 0 ? formatCurrencyEUR(s.mrr) : "—"}
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
