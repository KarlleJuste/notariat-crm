import { createClient } from "@supabase/supabase-js";

/** Client service (contourne RLS) — routes API sync HubSpot / Stripe */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Configuration Supabase service role manquante");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
