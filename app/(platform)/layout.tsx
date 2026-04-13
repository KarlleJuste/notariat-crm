import { createClient } from "@/lib/supabase/server";
import { getServerProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

/** cookies() / session Supabase : pas de pré-rendu statique des pages app. */
export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getServerProfile();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar profile={profile} userEmail={user?.email ?? null} />
      <div className="pl-[240px]">
        <div className="mx-auto max-w-7xl px-8 py-10">{children}</div>
      </div>
    </div>
  );
}
