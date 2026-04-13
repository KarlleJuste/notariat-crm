import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ORG_TYPE_BADGE,
  ORG_TYPE_LABELS,
  CRM_ORG_STATUS_LABELS,
  type OrgType,
} from "@/lib/constants";
import { loadDirectoryOrgs } from "@/lib/directory-query";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { DirectorySearchAndFilters } from "@/components/directory/directory-search-and-filters";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const supabase = await createClient();

  const { rows, error: loadErr } = await loadDirectoryOrgs(supabase, q, type);
  if (loadErr) {
    return (
      <p className="text-red-600">Erreur chargement : {loadErr.message}</p>
    );
  }

  const { data: contactsCount } = await supabase
    .from("notary_contacts")
    .select("org_id");

  const { data: allCommercials } = await supabase
    .from("commercials")
    .select("id, name");

  const commName = new Map(
    (allCommercials ?? []).map((c) => [c.id, c.name as string])
  );

  const countByOrg = new Map<string, number>();
  for (const c of contactsCount ?? []) {
    countByOrg.set(c.org_id, (countByOrg.get(c.org_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Organisations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Annuaire du notariat français — filtres, export et import Excel.
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />}>
          <DirectoryToolbar />
        </Suspense>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-500">Chargement des filtres…</p>}>
        <DirectorySearchAndFilters initialQ={q} initialType={type} />
      </Suspense>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 z-10 bg-white">Nom</TableHead>
              <TableHead className="sticky top-0 z-10 bg-white">Type</TableHead>
              <TableHead className="sticky top-0 z-10 bg-white">Région</TableHead>
              <TableHead className="sticky top-0 z-10 bg-white">Responsable</TableHead>
              <TableHead className="sticky top-0 z-10 bg-white">CRM</TableHead>
              <TableHead className="sticky top-0 z-10 bg-white">Contacts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Aucune organisation. Importez le fichier seed ou un Excel.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => {
                const badgeVariant =
                  ORG_TYPE_BADGE[o.type as OrgType] ?? "secondary";
                return (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link
                        href={`/directory/${o.id}`}
                        className="text-indigo-700 hover:underline"
                      >
                        {o.name}
                      </Link>
                      {o.short_name && (
                        <span className="ml-2 text-xs text-slate-400">
                          ({o.short_name})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant}>
                        {ORG_TYPE_LABELS[o.type as OrgType] ?? o.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {o.region ?? o.city ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">
                            {o.owner_commercial_id
                              ? (commName.get(o.owner_commercial_id) ?? "—")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "—"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-slate-700">
                          {o.owner_commercial_id
                            ? commName.get(o.owner_commercial_id) ?? "—"
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {CRM_ORG_STATUS_LABELS[o.crm_status] ?? o.crm_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{countByOrg.get(o.id) ?? 0}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
