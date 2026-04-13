# CRM Notariat (V2)

Plateforme web interne Next.js 14 + Supabase + Tailwind + shadcn-style UI : événements, démos HubSpot, MRR Stripe et annuaire des organisations notariales.

## Prérequis

- Node.js 20+
- Projet Supabase (Auth + PostgreSQL)
- Clés **HubSpot** (Private App / token) et **Stripe** (secret key)

## Installation

```bash
cd notariat-crm
cp .env.example .env.local
# Renseigner NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY, HUBSPOT_API_KEY, STRIPE_SECRET_KEY
npm install
npm run dev
```

## Base de données

1. Dans le SQL Editor Supabase, exécuter les fichiers dans `supabase/migrations/` dans l’ordre.
2. Exécuter `supabase/seed.sql` pour l’annuaire de base (CSN, 33 CR, CRIDON, etc.).  
   Les **72 chambres** complètes peuvent être importées via **Import Excel** sur `/directory`.
3. Optionnel : après l’équipe `commercials`, exécuter `supabase/seed_cannes_2026_demos.sql` (événement Cannes + listing démos). Régénération : `python3 scripts/generate-cannes-seed.py` depuis `scripts/cannes_2026_demos.csv`.

## Auth & rôles

- Créer un utilisateur dans **Authentication** (pas de page d’inscription).
- Table `profiles` : `app_role` = `manager` ou `commercial`, et `commercial_id` pointant vers `commercials` pour les commerciaux.
- Insérer les lignes `commercials` (nom, email, `hubspot_owner_id` aligné sur HubSpot).

## Intégrations

- **HubSpot** : `POST /api/hubspot/deals` (IDs de deals + `event_id`), `POST /api/hubspot/refresh`.
- **Stripe** : `POST /api/stripe/sync` (managers) — recalcule MRR, conversions et `mrr_unattributed`.
- Liens deals : optionnel `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` dans `.env.local`.

## Edge Functions

Stubs dans `supabase/functions/` — à brancher sur votre orchestration (cron Supabase) en réutilisant la logique TypeScript existante.
