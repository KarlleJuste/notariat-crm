import { createClient } from "@/lib/supabase/server";

export type AppProfile = {
  id: string;
  commercial_id: string | null;
  app_role: "manager" | "commercial";
  demos_view_mode: "table" | "kanban" | null;
};

export async function getServerProfile(): Promise<AppProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, commercial_id, app_role, demos_view_mode")
    .eq("id", user.id)
    .single();
  if (!data) return null;
  return data as AppProfile;
}

export async function requireManager() {
  const p = await getServerProfile();
  if (!p || p.app_role !== "manager") {
    return { ok: false as const, profile: p };
  }
  return { ok: true as const, profile: p };
}
