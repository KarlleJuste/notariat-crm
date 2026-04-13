/**
 * Edge Function — rafraîchit les deals HubSpot déjà présents dans `demos`.
 * Planifier : toutes les 30 minutes (pg_cron ou Supabase scheduled triggers).
 *
 * Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HUBSPOT_API_KEY
 * Logique : pour chaque hubspot_deal_id distinct, GET deal + mise à jour ;
 * si 404 → is_archived = true.
 *
 * Déployer : supabase functions deploy sync-hubspot-stages
 * Implémentation complète : réutiliser le code de /api/hubspot/refresh côté serveur
 * ou appeler une route interne sécurisée par secret.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async () => {
  return new Response(
    JSON.stringify({
      ok: false,
      message:
        "Stub — implémentez l’appel batch (deal par deal) ou déléguez à votre API Next avec CRON_SECRET.",
    }),
    { headers: { "Content-Type": "application/json" }, status: 501 }
  );
});
