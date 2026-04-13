# Guide de démarrage (sans coder)

## Sécurité importante

Tu as collé des clés dans un chat : **révoque-les et régénère-en des nouvelles** dès que tout fonctionne :

- **HubSpot** : Paramètres → Intégrations → Applications privées → régénérer le token.
- **Stripe** : Développeurs → Clés API → « Rouler » ou créer une nouvelle clé secrète.

Ensuite mets les **nouvelles** valeurs dans le fichier `.env.local` (remplace les anciennes lignes).

---

## 1. Installer Node.js (une seule fois sur ton Mac)

1. Ouvre **Terminal** (Spotlight : tape `Terminal`).
2. Si tu as **Homebrew**, tape : `brew install node` puis Entrée.
3. Sinon va sur **https://nodejs.org** → télécharge la version **LTS** → installe comme un logiciel normal.

---

## 2. Remplir Supabase dans `.env.local`

1. Va sur **https://supabase.com/dashboard** → ouvre **ton projet**.
2. Menu **Settings** (roue dentée) → **API**.
3. Copie-colle dans `.env.local` (avec l’éditeur Cursor / VS Code) :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (ne la montre à personne)

Enregistre le fichier.

---

## 3. Créer les tables et les données (SQL)

1. Toujours dans Supabase : menu **SQL Editor**.
2. Ouvre sur ton Mac le fichier du projet :  
   `notariat-crm/supabase/run-all-in-order.sql`
3. **Sélectionne tout** le texte (Cmd+A), **copie** (Cmd+C).
4. Dans SQL Editor, **colle**, clique **Run** (une seule fois sur un projet neuf).

Si tu as une erreur du type « already exists », dis-le à la personne qui t’aide : la base a peut-être déjà été initialisée.

### 3 bis. Événement « Cannes » et démos (optionnel)

Après l’équipe commerciale en base (Karl, Juliette, Quentin…), tu peux charger **l’événement Congrès Notaires Cannes (mars 2026)** et toutes les lignes démo exportées du listing commercial :

1. Régénère le SQL si tu modifies le CSV :  
   `python3 scripts/generate-cannes-seed.py`
2. Dans **SQL Editor** Supabase, ouvre et exécute **une fois** :  
   `notariat-crm/supabase/seed_cannes_2026_demos.sql`

Les deals ont un `hubspot_deal_id` factice `IMPORT-CANNES-*` jusqu’à ce que tu colles les **vrais ID HubSpot** (ou que tu ajoutes les deals via le panneau « Ajouter des démos » sur la fiche événement). Ensuite, **Rafraîchir depuis HubSpot** met à jour **stage**, **deal_name**, etc.

**Export HubSpot utile pour le dashboard (à faire côté HubSpot puis enrichir le CRM)** : pour chaque deal lié à Cannes, récupère au minimum **Record ID** (deal), **Deal stage** / pipeline, **Deal name**, **Amount** (si utilisé), **Associated contact** (email — sert au **MRR Stripe** si l’email matche un client Stripe), **Create date**, **Close date**. Colle les **Record ID** dans le CRM à la place des `IMPORT-CANNES-*` (requête `UPDATE demos SET hubspot_deal_id = '…' WHERE contact_email = '…'` ou ré-import). Lance **Synchroniser Stripe / conversions** sur la page MRR pour remonter **stripe_mrr** / conversion quand c’est câblé.

---

## 4. Connexion (mot de passe seul)

Tu n’as **pas** besoin de créer un utilisateur à la main dans Supabase pour te connecter.

1. Lance l’app (étape 5).
2. Sur `/login`, entre uniquement le mot de passe équipe : **`primmo2026`** (par défaut).
3. Au **premier** essai, l’app crée automatiquement le compte technique **`acces@primmo.internal`** dans Supabase Auth (grâce à la clé `service_role`).

---

## 5. Lier le profil (manager) et un commercial (minimum)

Après **une première connexion réussie**, exécute **une fois** dans **SQL Editor** (adapte le nom / email du commercial si tu veux) :

```sql
-- 1) Un commercial (exemple)
INSERT INTO commercials (name, email, role)
VALUES ('Moi', 'moi@primmo.co', 'manager')
ON CONFLICT (email) DO NOTHING;

-- 2) Lier le compte technique Auth au profil manager
UPDATE profiles
SET
  app_role = 'manager',
  commercial_id = (SELECT id FROM commercials WHERE email = 'moi@primmo.co' LIMIT 1)
WHERE id = (SELECT id FROM auth.users WHERE email = 'acces@primmo.internal' LIMIT 1);
```

*(Si tu as changé `NEXT_PUBLIC_PRIMMO_GATE_EMAIL` dans `.env.local`, remplace `acces@primmo.internal` par cette adresse.)*

---

## 6. Lancer l’application sur ton Mac

1. Terminal :

```bash
cd ~/Documents/notariat-crm
npm install
npm run dev
```

2. Ouvre le navigateur à l’adresse affichée (souvent **http://localhost:3000**).
3. Sur la page de connexion : **mot de passe uniquement** (`primmo2026` par défaut).

---

## 7. Stripe : vérifier la clé

Si un message d’erreur parle d’**API key** ou **Stripe** :

1. Stripe → **Développeurs** → **Clés API**.
2. Sous **Clé secrète**, clique pour **révéler** et copie une clé qui commence par **`sk_test_`** ou **`sk_live_`**.
3. Colle-la dans `.env.local` à la place de `STRIPE_SECRET_KEY=...`.
4. Arrête le serveur (Terminal : Ctrl+C), relance `npm run dev`.

---

## 8. HubSpot (pour les démos)

Quand tu ajoutes des deals, il faudra aussi que les **owners HubSpot** correspondent aux colonnes `hubspot_owner_id` dans la table `commercials` (page **Paramètres → Équipe & HubSpot** pour les renseigner).

Récap des champs déjà utilisés ou utiles côté app : **stage** (Kanban / taux conversion), **contact_email** (attribution Stripe), **is_converted** / **stripe_mrr** (sync), **deal_name** — tout ça est alimenté par l’API HubSpot au rafraîchissement ou par Stripe selon ta config.

---

En cas de blocage, note **le message d’erreur exact** (copier-coller) et à quelle étape tu es.
