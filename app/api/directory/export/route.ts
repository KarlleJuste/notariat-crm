import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { ORG_TYPE_LABELS, type OrgType } from "@/lib/constants";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim();

  let query = supabase
    .from("notary_orgs")
    .select(
      "name, short_name, type, region, departments, address, city, postal_code, website, email, phone, description, legal_status, crm_status, last_contacted_at, owner_notes"
    )
    .order("name");

  if (type) {
    const types = type.split(",").filter(Boolean);
    if (types.length) query = query.in("type", types);
  }

  const { data: rows, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  let filtered = rows ?? [];
  if (q) {
    const qq = q.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name?.toLowerCase().includes(qq) ||
        (r.short_name && r.short_name.toLowerCase().includes(qq)) ||
        (r.city && r.city.toLowerCase().includes(qq))
    );
  }

  const sheetRows = filtered.map((r) => ({
    Nom: r.name,
    "Nom court": r.short_name,
    Type: ORG_TYPE_LABELS[r.type as OrgType] ?? r.type,
    Région: r.region,
    Départements: Array.isArray(r.departments) ? r.departments.join(",") : "",
    Adresse: r.address,
    Ville: r.city,
    "Code postal": r.postal_code,
    Site: r.website,
    Email: r.email,
    Téléphone: r.phone,
    Description: r.description,
    "Statut juridique": r.legal_status,
    "Statut CRM": r.crm_status,
    "Dernier contact": r.last_contacted_at,
    "Notes internes": r.owner_notes,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, ws, "Organisations");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="annuaire-organisations.xlsx"`,
    },
  });
}
