import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  ORG_TYPE_BADGE,
  ORG_TYPE_LABELS,
  type OrgType,
} from "@/lib/constants";
import { OrgCrmCard } from "@/components/directory/org-crm-card";
import { OrgCoordinatesCard } from "@/components/directory/org-coordinates-card";
import { ContactsSection } from "@/components/directory/contacts-section";
import { OrgActivityNotes } from "@/components/directory/org-activity-notes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase
      .from("notary_orgs")
      .select("name")
      .eq("id", id)
      .single();
    return {
      title: data?.name ? `${data.name}` : "Organisation",
    };
  } catch {
    return { title: "Organisation" };
  }
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("notary_orgs")
    .select("*")
    .eq("id", id)
    .single();

  if (!org) notFound();

  const { data: contacts } = await supabase
    .from("notary_contacts")
    .select("*")
    .eq("org_id", id)
    .order("lastname", { ascending: true });

  const { data: commercials } = await supabase
    .from("commercials")
    .select("id, name")
    .order("name");

  const { data: noteRows } = await supabase
    .from("org_activity")
    .select("id, detail, created_at")
    .eq("org_id", id)
    .eq("action", "note")
    .order("created_at", { ascending: false });

  const badgeVariant = ORG_TYPE_BADGE[org.type as OrgType] ?? "secondary";

  return (
    <div className="space-y-8">
      <div>
        <nav
          className="flex flex-wrap items-center gap-1 text-sm text-slate-500"
          aria-label="Fil d’Ariane"
        >
          <Link href="/directory" className="text-indigo-600 hover:underline">
            Annuaire
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
          <span className="font-medium text-slate-800">{org.name}</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {org.name}
          </h1>
          {org.short_name && (
            <Badge variant="secondary">{org.short_name}</Badge>
          )}
          <Badge variant={badgeVariant}>
            {ORG_TYPE_LABELS[org.type as OrgType] ?? org.type}
          </Badge>
          {org.legal_status && (
            <span className="text-sm text-slate-500">{org.legal_status}</span>
          )}
        </div>
      </div>

      <OrgCoordinatesCard org={org} />

      <OrgCrmCard org={org} commercials={commercials ?? []} />

      <OrgActivityNotes orgId={id} notes={noteRows ?? []} />

      <ContactsSection
        orgId={id}
        contacts={contacts ?? []}
        commercials={commercials ?? []}
      />
    </div>
  );
}
