import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  ORG_TYPES,
  ORG_TYPE_LABELS,
  type OrgType,
} from "@/lib/constants";

const rowSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  short_name: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  departments: z.array(z.string()).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  legal_status: z.string().optional().nullable(),
});

const bodySchema = z.object({
  confirm: z.boolean().optional(),
  rows: z.array(rowSchema).min(1),
});

function normalizeType(t: string): OrgType | null {
  const raw = t.trim();
  const labelMatch = (Object.entries(ORG_TYPE_LABELS) as [OrgType, string][]).find(
    ([, label]) => label.toLowerCase() === raw.toLowerCase()
  );
  if (labelMatch) return labelMatch[0];

  const x = raw.toLowerCase().replace(/\s+/g, "_");
  if (ORG_TYPES.includes(x as OrgType)) return x as OrgType;
  const map: Record<string, OrgType> = {
    "instance nationale": "instance_nationale",
    "conseil régional": "conseil_regional",
    "conseil regional": "conseil_regional",
    chambre: "chambre",
    cridon: "cridon",
    formation: "formation",
    "organisme social": "organisme_social",
    "syndicat employeur": "syndicat_employeur",
    "syndicat salarié": "syndicat_salarie",
    "syndicat salarie": "syndicat_salarie",
    association: "association",
    international: "international",
  };
  return map[t.trim().toLowerCase()] ?? null;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { rows, confirm } = parsed.data;
  const preview = rows.map((r, i) => {
    const nt = normalizeType(r.type);
    return {
      line: i + 1,
      name: r.name,
      type: r.type,
      normalizedType: nt,
      ok: nt !== null,
    };
  });

  if (!confirm) {
    return NextResponse.json({ preview, count: rows.length });
  }

  const errors: string[] = [];
  let upserted = 0;

  for (const r of rows) {
    const nt = normalizeType(r.type);
    if (!nt) {
      errors.push(`Type inconnu pour « ${r.name} » : ${r.type}`);
      continue;
    }

    const { data: existing } = await supabase
      .from("notary_orgs")
      .select("id")
      .eq("name", r.name)
      .eq("type", nt)
      .maybeSingle();

    const payload = {
      name: r.name,
      type: nt,
      short_name: r.short_name ?? null,
      region: r.region ?? null,
      departments: r.departments?.length ? r.departments : null,
      address: r.address ?? null,
      city: r.city ?? null,
      postal_code: r.postal_code ?? null,
      website: r.website ?? null,
      email: r.email ?? null,
      phone: r.phone ?? null,
      description: r.description ?? null,
      legal_status: r.legal_status ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("notary_orgs")
        .update(payload)
        .eq("id", existing.id);
      if (error) errors.push(`${r.name}: ${error.message}`);
      else upserted++;
    } else {
      const { error } = await supabase.from("notary_orgs").insert(payload);
      if (error) errors.push(`${r.name}: ${error.message}`);
      else upserted++;
    }
  }

  return NextResponse.json({ upserted, errors });
}
