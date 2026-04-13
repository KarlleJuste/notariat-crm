"use client";

import { useMemo, useState, useEffect } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEMO_STAGE_ORDER } from "@/lib/constants";
import { columnForStage } from "@/lib/demo-stage";
import { formatCurrencyEUR } from "@/lib/utils";
import { DemoPanel } from "@/components/demos/demo-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORAGE_KEY = "notariat-crm-demos-view";

const KANBAN_COLUMNS = [...DEMO_STAGE_ORDER, "Autre"] as const;

const KANBAN_HEADER_SHORT: Record<string, string> = {
  "1st demo booked": "1st demo",
  "Maybe - under consideration": "Maybe",
  "Follow-up call booked": "Follow-up",
  "Invite sent": "Invite",
  "Onboarding scheduled": "Onboarding",
  "Closed Won": "Closed Won",
  "Closed Lost": "Closed Lost",
  Churned: "Churned",
  Autre: "Autre",
};

const hubspotPortal = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;

type DemoRow = {
  id: string;
  hubspot_deal_id: string;
  deal_name: string | null;
  contact_name: string | null;
  contact_company: string | null;
  contact_email: string | null;
  stage: string | null;
  is_converted: boolean;
  is_churned: boolean;
  stripe_mrr: number | null;
  created_at: string;
  event_id: string;
  events: { name: string } | null;
  commercial_id: string | null;
  commercials: { name: string; avatar_url: string | null } | null;
};

export function DemosView({
  demos,
  events,
  commercials,
}: {
  demos: DemoRow[];
  events: { id: string; name: string }[];
  commercials: { id: string; name: string }[];
}) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [selected, setSelected] = useState<DemoRow | null>(null);
  const [fEvent, setFEvent] = useState<string>("all");
  const [fComm, setFComm] = useState<string>("all");
  const [fConv, setFConv] = useState<string>("all");

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY) as "table" | "kanban" | null;
    if (v === "kanban" || v === "table") setView(v);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  const filtered = useMemo(() => {
    return demos.filter((d) => {
      if (fEvent !== "all" && d.event_id !== fEvent) return false;
      if (fComm !== "all" && d.commercial_id !== fComm) return false;
      if (fConv === "yes" && !d.is_converted) return false;
      if (fConv === "no" && d.is_converted) return false;
      return true;
    });
  }, [demos, fEvent, fComm, fConv]);

  const byCol = useMemo(() => {
    const m = new Map<string, DemoRow[]>();
    for (const c of KANBAN_COLUMNS) m.set(c, []);
    for (const d of filtered) {
      const col = columnForStage(d.stage);
      m.get(col)?.push(d);
    }
    return m;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={fEvent} onValueChange={setFEvent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Événement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les événements</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fComm} onValueChange={setFComm}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Commercial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les commerciaux</SelectItem>
              {commercials.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fConv} onValueChange={setFConv}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Converti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="yes">Converti</SelectItem>
              <SelectItem value="no">Non converti</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
          <TabsList>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="h-4 w-4" />
              Tableau
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "table" ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Commercial</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Converti</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>HubSpot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-slate-500">
                    Aucune démo ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(d)}
                  >
                    <TableCell className="font-medium">
                      {d.contact_name ?? d.deal_name ?? "—"}
                    </TableCell>
                    <TableCell>{d.contact_company ?? "—"}</TableCell>
                    <TableCell>{d.commercials?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {d.events?.name ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-600">
                      {d.stage ?? "—"}
                    </TableCell>
                    <TableCell>
                      {d.created_at?.slice(0, 10) ?? "—"}
                    </TableCell>
                    <TableCell>
                      {d.is_converted ? (
                        <Badge variant="success">✓</Badge>
                      ) : (
                        <Badge variant="secondary">—</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {d.stripe_mrr != null
                        ? formatCurrencyEUR(Number(d.stripe_mrr))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {hubspotPortal ? (
                        <a
                          href={`https://app.hubspot.com/contacts/${hubspotPortal}/record/0-3/${d.hubspot_deal_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-indigo-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ouvrir
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-slate-400">
                          —
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
          <p className="mb-3 text-center text-xs text-slate-500">
            Faites défiler horizontalement pour voir toutes les colonnes (Closed Won, Lost, Churned…).
          </p>
          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 [scrollbar-width:thin]">
          {KANBAN_COLUMNS.map((col) => {
            const items = byCol.get(col) ?? [];
            const short = KANBAN_HEADER_SHORT[col] ?? col;
            return (
            <div
              key={col}
              className="min-w-[260px] max-w-[280px] shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
            >
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600"
                title={col}
              >
                {short}{" "}
                <span className="font-normal text-slate-400">({items.length})</span>
              </p>
              <div className="space-y-2">
                {items.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(d)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
                  >
                    <p className="font-medium text-slate-900">
                      {d.contact_name ?? d.deal_name ?? "Deal"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {d.contact_company ?? "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {d.commercials?.avatar_url && (
                          <AvatarImage src={d.commercials.avatar_url} alt="" />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {d.commercials?.name?.slice(0, 2).toUpperCase() ??
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <Badge variant="secondary" className="max-w-[140px] truncate text-[10px]">
                        {d.events?.name ?? "—"}
                      </Badge>
                    </div>
                    {d.is_converted && (
                      <Badge variant="success" className="mt-2 text-[10px]">
                        Converti
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
            );
          })}
          </div>
        </div>
      )}

      <DemoPanel demo={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
