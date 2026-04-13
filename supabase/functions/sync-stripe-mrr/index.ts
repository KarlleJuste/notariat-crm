/**
 * Edge Function — sync MRR + conversions (02:00 quotidien).
 * Variables : STRIPE_SECRET_KEY, HUBSPOT_API_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Recommandation : dupliquer la logique de `lib/sync/stripe-mrr.ts` en Deno
 * ou invoquer `POST /api/stripe/sync` avec un header `Authorization: Bearer CRON_SECRET`.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async () => {
  return new Response(
    JSON.stringify({
      ok: false,
      message:
        "Stub — branchez Stripe + HubSpot comme dans runStripeMrrSync() ou appelez l’API Next protégée.",
    }),
    { headers: { "Content-Type": "application/json" }, status: 501 }
  );
});
