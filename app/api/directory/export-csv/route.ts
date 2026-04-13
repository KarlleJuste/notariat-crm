import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadDirectoryOrgs, csvEscape } from "@/lib/directory-query";
import {
  ORG_TYPE_LABELS,
  CRM_ORG_STATUS_LABELS,
  type OrgType,
} from "@/lib/constants";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const { rows, error } = await loadDirectoryOrgs(supabase, q, type);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const header = [
    "Nom",
    "Nom court",
    "Type",
    "Région",
    "Ville",
    "Statut CRM",
    "Responsable",
    "Nb contacts",
  ];

  const lines = [header.join(",")];

  for (const o of rows) {
    const owner = o.owner_commercial_id
      ? commName.get(o.owner_commercial_id) ?? ""
      : "";
    const line = [
      csvEscape(o.name),
      csvEscape(o.short_name ?? ""),
      csvEscape(ORG_TYPE_LABELS[o.type as OrgType] ?? o.type),
      csvEscape(o.region ?? ""),
      csvEscape(o.city ?? ""),
      csvEscape(CRM_ORG_STATUS_LABELS[o.crm_status] ?? o.crm_status),
      csvEscape(owner),
      String(countByOrg.get(o.id) ?? 0),
    ].join(",");
    lines.push(line);
  }

  const body = "\uFEFF" + lines.join("\n");
  const filename = `annuaire-organisations-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
