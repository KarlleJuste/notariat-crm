import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerProfile } from "@/lib/auth";
import { TeamSettingsTable } from "@/components/settings/team-settings-table";

export default async function TeamSettingsPage() {
  const profile = await getServerProfile();
  if (profile?.app_role !== "manager") {
    redirect("/events");
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("commercials")
    .select("id, name, email, hubspot_owner_id, role")
    .order("name");

  if (error) {
    return (
      <p className="text-red-600">Erreur chargement équipe : {error.message}</p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Équipe commerciale
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Modifiez les commerciaux, leurs emails et les identifiants propriétaire
          HubSpot (<span className="font-mono">hubspot_owner_id</span>) utilisés
          pour l’attribution des deals.
        </p>
      </div>
      <TeamSettingsTable rows={rows ?? []} />
    </div>
  );
}
