-- =============================================================================
-- EXÉCUTION UNIQUE dans Supabase → SQL Editor (nouveau projet ou base vide).
-- Ordre : migration initiale → policies commercials → seed annuaire.
-- Ne pas réexécuter le seed tel quel sur une base déjà peuplée (doublons possibles).
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Commercials (équipe commerciale)
CREATE TABLE commercials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hubspot_owner_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'commercial' CHECK (role IN ('commercial', 'manager')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profils liés à Supabase Auth (rôle UI)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  commercial_id UUID REFERENCES commercials(id) ON DELETE SET NULL,
  app_role TEXT NOT NULL DEFAULT 'commercial' CHECK (app_role IN ('manager', 'commercial')),
  demos_view_mode TEXT DEFAULT 'table' CHECK (demos_view_mode IN ('table', 'kanban')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Événements
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('salon_congres', 'webinar_conference')),
  date DATE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'a_venir' CHECK (status IN ('a_venir', 'termine', 'annule')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_commercials (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  commercial_id UUID NOT NULL REFERENCES commercials(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, commercial_id)
);

-- Démos (deals HubSpot liés à un événement)
CREATE TABLE demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_deal_id TEXT UNIQUE NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  commercial_id UUID REFERENCES commercials(id) ON DELETE SET NULL,
  contact_email TEXT,
  contact_name TEXT,
  contact_company TEXT,
  stage TEXT,
  deal_name TEXT,
  close_date DATE,
  is_converted BOOLEAN DEFAULT false,
  is_churned BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_mrr DECIMAL(10,2),
  raw_data JSONB,
  is_archived BOOLEAN DEFAULT false,
  is_removed BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_demos_event ON demos(event_id) WHERE NOT is_archived AND NOT is_removed;
CREATE INDEX idx_demos_commercial ON demos(commercial_id) WHERE NOT is_archived AND NOT is_removed;

-- Snapshots MRR
CREATE TABLE mrr_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID REFERENCES commercials(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  mrr_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  active_subscriptions INT DEFAULT 0,
  demos_converted_count INT DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (commercial_id, month)
);

-- Abonnements non attribués (alerte MRR)
CREATE TABLE mrr_unattributed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_email TEXT,
  amount_monthly DECIMAL(10,2) NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (stripe_subscription_id, month)
);

-- Organisations notariat
CREATE TABLE notary_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT NOT NULL,
  region TEXT,
  departments TEXT[],
  address TEXT,
  city TEXT,
  postal_code TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  description TEXT,
  legal_status TEXT,
  owner_commercial_id UUID REFERENCES commercials(id) ON DELETE SET NULL,
  owner_notes TEXT,
  crm_status TEXT NOT NULL DEFAULT 'prospect' CHECK (
    crm_status IN ('prospect', 'contacted', 'partner', 'client', 'inactive')
  ),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notary_orgs_name ON notary_orgs USING gin (
  to_tsvector(
    'simple',
    coalesce(name, '') || ' ' || coalesce(short_name, '') || ' ' || coalesce(city, '')
  )
);
CREATE INDEX idx_notary_orgs_type ON notary_orgs(type);

CREATE TABLE notary_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES notary_orgs(id) ON DELETE CASCADE,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  title TEXT,
  commission TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  hubspot_contact_id TEXT,
  contacted_by_commercial_id UUID REFERENCES commercials(id) ON DELETE SET NULL,
  contact_status TEXT NOT NULL DEFAULT 'a_contacter' CHECK (
    contact_status IN ('a_contacter', 'contacte', 'en_discussion', 'converti', 'inactif')
  ),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notary_contacts_org ON notary_contacts(org_id);

-- Journal d'activité annuaire
CREATE TABLE org_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES notary_orgs(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_org_activity_org ON org_activity(org_id);

-- Helpers updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_events_updated BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_demos_updated BEFORE UPDATE ON demos FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_notary_orgs_updated BEFORE UPDATE ON notary_orgs FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_notary_contacts_updated BEFORE UPDATE ON notary_contacts FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS
ALTER TABLE commercials ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_commercials ENABLE ROW LEVEL SECURITY;
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrr_unattributed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_activity ENABLE ROW LEVEL SECURITY;

-- Helper: utilisateur courant est manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.app_role = 'manager'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION my_commercial_id()
RETURNS UUID AS $$
  SELECT commercial_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Policies: commercials — lecture pour tout utilisateur authentifié
CREATE POLICY commercials_select ON commercials FOR SELECT TO authenticated USING (true);

-- profiles — chacun lit/maj son profil
CREATE POLICY profiles_self_select ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_self_update ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- events
CREATE POLICY events_select ON events FOR SELECT TO authenticated USING (
  is_manager()
  OR EXISTS (
    SELECT 1 FROM event_commercials ec
    WHERE ec.event_id = events.id AND ec.commercial_id = my_commercial_id()
  )
);
CREATE POLICY events_all_manager ON events FOR ALL TO authenticated USING (is_manager()) WITH CHECK (is_manager());

-- event_commercials
CREATE POLICY ec_select ON event_commercials FOR SELECT TO authenticated USING (
  is_manager()
  OR commercial_id = my_commercial_id()
);
CREATE POLICY ec_all_manager ON event_commercials FOR ALL TO authenticated USING (is_manager()) WITH CHECK (is_manager());

-- demos
CREATE POLICY demos_select ON demos FOR SELECT TO authenticated USING (
  is_manager() OR commercial_id = my_commercial_id()
);
CREATE POLICY demos_all_manager ON demos FOR ALL TO authenticated USING (is_manager()) WITH CHECK (is_manager());

-- mrr_snapshots
CREATE POLICY mrr_select ON mrr_snapshots FOR SELECT TO authenticated USING (
  is_manager() OR commercial_id = my_commercial_id()
);
CREATE POLICY mrr_all_manager ON mrr_snapshots FOR ALL TO authenticated USING (is_manager()) WITH CHECK (is_manager());

-- mrr_unattributed — managers only
CREATE POLICY mrr_unattrib_select ON mrr_unattributed FOR SELECT TO authenticated USING (is_manager());
CREATE POLICY mrr_unattrib_all ON mrr_unattributed FOR ALL TO authenticated USING (is_manager()) WITH CHECK (is_manager());

-- annuaire — toute l'équipe authentifiée
CREATE POLICY orgs_all ON notary_orgs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY contacts_all ON notary_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY org_activity_all ON org_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insertion profil à la création user (optionnel — peut être fait manuellement)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, app_role)
  VALUES (NEW.id, 'manager')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON TABLE demos IS 'Deals HubSpot importés manuellement par événement uniquement.';
COMMENT ON TABLE mrr_unattributed IS 'Abonnements Stripe sans chaîne HubSpot complète pour attribution MRR.';
-- Permettre aux managers de gérer la table commercials (onboarding équipe)
CREATE POLICY commercials_manager_insert ON commercials FOR INSERT TO authenticated
  WITH CHECK (is_manager());
CREATE POLICY commercials_manager_update ON commercials FOR UPDATE TO authenticated
  USING (is_manager()) WITH CHECK (is_manager());
CREATE POLICY commercials_manager_delete ON commercials FOR DELETE TO authenticated
  USING (is_manager());
-- Seed annuaire (exécuter après migrations). Complétez les 72 chambres via import Excel si besoin.

-- Instance nationale — CSN
INSERT INTO notary_orgs (name, short_name, type, city, postal_code, address, description, legal_status)
VALUES (
  'Conseil Supérieur du Notariat',
  'CSN',
  'instance_nationale',
  'Paris',
  '75007',
  '60 boulevard de La Tour-Maubourg',
  'Instance nationale de la profession notariale.',
  'Établissement d''utilité publique'
);

-- Contacts CSN (org_id = dernier CSN inséré)
WITH csn AS (
  SELECT id FROM notary_orgs WHERE short_name = 'CSN' AND type = 'instance_nationale' LIMIT 1
)
INSERT INTO notary_contacts (org_id, firstname, lastname, title, commission, is_primary)
SELECT id, 'Bertrand', 'Savouré', 'Président', NULL, true FROM csn
UNION ALL SELECT id, 'Jean-Michel', 'Mathieu', NULL, 'Commission Économie', false FROM csn
UNION ALL SELECT id, 'Pauline', 'Malaplate', NULL, 'Commission Engagement', false FROM csn
UNION ALL SELECT id, 'Ludovic', 'Froment', NULL, 'Commission Europe et International', false FROM csn
UNION ALL SELECT id, 'Olivier', 'Daigre', NULL, 'Commission Instances', false FROM csn
UNION ALL SELECT id, 'Arielle', 'Dupont-Stival', NULL, 'Commission Offices', false FROM csn
UNION ALL SELECT id, 'Laurence', 'Chabas-Petruccelli', NULL, 'Commission Statuts', false FROM csn;

-- 33 Conseils régionaux (sièges indicatifs)
INSERT INTO notary_orgs (name, short_name, type, region, city) VALUES
('Conseil régional des notaires d''Agen', 'CR Agen', 'conseil_regional', 'Nouvelle-Aquitaine', 'Agen'),
('Conseil régional des notaires d''Aix-en-Provence', 'CR Aix', 'conseil_regional', 'Provence-Alpes-Côte d''Azur', 'Aix-en-Provence'),
('Conseil régional des notaires d''Amiens', 'CR Amiens', 'conseil_regional', 'Hauts-de-France', 'Amiens'),
('Conseil régional des notaires d''Angers', 'CR Angers', 'conseil_regional', 'Pays de la Loire', 'Angers'),
('Conseil régional des notaires de Bastia', 'CR Bastia', 'conseil_regional', 'Corse', 'Bastia'),
('Conseil régional des notaires de Besançon', 'CR Besançon', 'conseil_regional', 'Bourgogne-Franche-Comté', 'Besançon'),
('Conseil régional des notaires de Bordeaux', 'CR Bordeaux', 'conseil_regional', 'Nouvelle-Aquitaine', 'Bordeaux'),
('Conseil régional des notaires de Bourges', 'CR Bourges', 'conseil_regional', 'Centre-Val de Loire', 'Bourges'),
('Conseil régional des notaires de Caen', 'CR Caen', 'conseil_regional', 'Normandie', 'Caen'),
('Conseil régional des notaires de Chambéry', 'CR Chambéry', 'conseil_regional', 'Auvergne-Rhône-Alpes', 'Chambéry'),
('Conseil régional des notaires de Colmar / Metz', 'CR Colmar-Metz', 'conseil_regional', 'Grand Est', 'Colmar'),
('Conseil régional des notaires de Dijon', 'CR Dijon', 'conseil_regional', 'Bourgogne-Franche-Comté', 'Dijon'),
('Conseil régional des notaires de Douai', 'CR Douai', 'conseil_regional', 'Hauts-de-France', 'Douai'),
('Conseil régional des notaires de Grenoble', 'CR Grenoble', 'conseil_regional', 'Auvergne-Rhône-Alpes', 'Grenoble'),
('Conseil régional des notaires de Limoges', 'CR Limoges', 'conseil_regional', 'Nouvelle-Aquitaine', 'Limoges'),
('Conseil régional des notaires de Lyon', 'CR Lyon', 'conseil_regional', 'Auvergne-Rhône-Alpes', 'Lyon'),
('Conseil régional des notaires de Montpellier', 'CR Montpellier', 'conseil_regional', 'Occitanie', 'Montpellier'),
('Conseil régional des notaires de Nancy', 'CR Nancy', 'conseil_regional', 'Grand Est', 'Nancy'),
('Conseil régional des notaires de Nîmes', 'CR Nîmes', 'conseil_regional', 'Occitanie', 'Nîmes'),
('Conseil régional des notaires d''Orléans', 'CR Orléans', 'conseil_regional', 'Centre-Val de Loire', 'Orléans'),
('Conseil régional des notaires de Paris-I', 'CR Paris-I', 'conseil_regional', 'Île-de-France', 'Paris'),
('Conseil régional des notaires de Paris-II', 'CR Paris-II', 'conseil_regional', 'Île-de-France', 'Paris'),
('Conseil régional des notaires de Pau', 'CR Pau', 'conseil_regional', 'Nouvelle-Aquitaine', 'Pau'),
('Conseil régional des notaires de Poitiers', 'CR Poitiers', 'conseil_regional', 'Nouvelle-Aquitaine', 'Poitiers'),
('Conseil régional des notaires de Reims', 'CR Reims', 'conseil_regional', 'Grand Est', 'Reims'),
('Conseil régional des notaires de Rennes', 'CR Rennes', 'conseil_regional', 'Bretagne', 'Rennes'),
('Conseil régional des notaires de Riom', 'CR Riom', 'conseil_regional', 'Auvergne-Rhône-Alpes', 'Riom'),
('Conseil régional des notaires de Rouen', 'CR Rouen', 'conseil_regional', 'Normandie', 'Rouen'),
('Conseil régional des notaires de Toulouse', 'CR Toulouse', 'conseil_regional', 'Occitanie', 'Toulouse'),
('Conseil régional des notaires de Versailles', 'CR Versailles', 'conseil_regional', 'Île-de-France', 'Versailles'),
('Conseil régional des notaires de Basse-Terre', 'CR Basse-Terre', 'conseil_regional', 'Guadeloupe', 'Basse-Terre'),
('Conseil régional des notaires de Fort-de-France', 'CR Fort-de-France', 'conseil_regional', 'Martinique', 'Fort-de-France'),
('Conseil régional des notaires de Saint-Denis', 'CR Saint-Denis', 'conseil_regional', 'La Réunion', 'Saint-Denis');

-- CRIDON
INSERT INTO notary_orgs (name, short_name, type, city, postal_code, address) VALUES
('CRIDON Paris', 'CRIDON Paris', 'cridon', 'Paris', '75013', '180 avenue de Choisy'),
('CRIDON Nord-Est', 'CRIDON NE', 'cridon', 'Strasbourg', NULL, NULL),
('CRIDON Lyon', 'CRIDON Lyon', 'cridon', 'Lyon', '69455', '37 boulevard des Brotteaux'),
('CRIDON Sud-Ouest', 'CRIDON SO', 'cridon', 'Bordeaux', '33070', '18 rue Claude Boucher'),
('CRIDON Ouest', 'CRIDON Ouest', 'cridon', 'Nantes', '44323', '35 boulevard Albert Einstein');

-- Formations
INSERT INTO notary_orgs (name, short_name, type) VALUES
('INAFON', 'INAFON', 'formation'),
('CNEPN', 'CNEPN', 'formation'),
('Institut d''études judiciaires (IEJ)', 'IEJ', 'formation'),
('IMN / CFPN', 'IMN/CFPN', 'formation');

-- Organismes sociaux
INSERT INTO notary_orgs (name, short_name, type) VALUES
('CPRN', 'CPRN', 'organisme_social'),
('CRPCEN', 'CRPCEN', 'organisme_social');

-- Syndicats employeurs
INSERT INTO notary_orgs (name, short_name, type, description) VALUES
('Syndicat national des notaires (SNN)', 'SNN', 'syndicat_employeur', 'Créé en 1949'),
('SNF / UNNE', 'SNF/UNNE', 'syndicat_employeur', 'Créé en 1984');

-- Syndicats salariés (représentativité 2021 en description)
INSERT INTO notary_orgs (name, short_name, type, description) VALUES
('FGCEN FO', 'FGCEN FO', 'syndicat_salarie', 'Représentativité 2021 : selon élections professionnelles du secteur'),
('FS CFDT', 'FS CFDT', 'syndicat_salarie', 'Représentativité 2021 : selon élections professionnelles du secteur'),
('FSE CGT', 'FSE CGT', 'syndicat_salarie', 'Représentativité 2021 : selon élections professionnelles du secteur'),
('SNCTN CFE-CGC', 'SNCTN', 'syndicat_salarie', 'Représentativité 2021 : selon élections professionnelles du secteur'),
('CSFV CFTC', 'CSFV', 'syndicat_salarie', 'Représentativité 2021 : selon élections professionnelles du secteur'),
('UNSA', 'UNSA', 'syndicat_salarie', 'Représentativité 2021 : selon élections professionnelles du secteur');

-- Associations
INSERT INTO notary_orgs (name, short_name, type) VALUES
('ACSEN', 'ACSEN', 'association'),
('ALNF', 'ALNF', 'association'),
('ANC', 'ANC', 'association'),
('IIHN', 'IIHN', 'association'),
('Comité Mixte CSN', 'Comité Mixte CSN', 'association');

-- International
INSERT INTO notary_orgs (name, short_name, type) VALUES
('Union Internationale du Notariat (UIN)', 'UIN', 'international'),
('Commission du droit européen des notaires (CNUE)', 'CNUE', 'international'),
('Association des notaires français à l''étranger (ANF)', 'ANF', 'international'),
('Bureau des notaires de France à Bruxelles', 'Bruxelles', 'international'),
('CSN International', 'CSN Intl', 'international');

-- Échantillon de chambres (compléter à 72 via import)
INSERT INTO notary_orgs (name, short_name, type, departments, city) VALUES
('Chambre des notaires de Paris', 'CDNP', 'chambre', ARRAY['75'], 'Paris'),
('Chambre des notaires des Hauts-de-Seine', 'CDN 92', 'chambre', ARRAY['92'], 'Nanterre'),
('Chambre des notaires de la Seine-Saint-Denis', 'CDN 93', 'chambre', ARRAY['93'], 'Bobigny'),
('Chambre des notaires du Val-de-Marne', 'CDN 94', 'chambre', ARRAY['94'], 'Créteil'),
('Chambre des notaires du Rhône', 'CDN 69', 'chambre', ARRAY['69'], 'Lyon'),
('Chambre des notaires de la Gironde', 'CDN 33', 'chambre', ARRAY['33'], 'Bordeaux'),
('Chambre des notaires des Bouches-du-Rhône', 'CDN 13', 'chambre', ARRAY['13'], 'Aix-en-Provence'),
('Chambre des notaires du Nord', 'CDN 59', 'chambre', ARRAY['59'], 'Lille'),
('Chambre des notaires de l''Hérault', 'CDN 34', 'chambre', ARRAY['34'], 'Montpellier'),
('Chambre des notaires de la Loire-Atlantique', 'CDN 44', 'chambre', ARRAY['44'], 'Nantes');

-- Équipe commerciale Primmo (Karl, Juliette, Quentin, Max, Adam)
INSERT INTO commercials (name, email, role)
VALUES
  ('Karl', 'karl@primmo.co', 'commercial'),
  ('Juliette', 'juliette@primmo.co', 'commercial'),
  ('Quentin', 'quentin@primmo.co', 'commercial'),
  ('Max', 'max@primmo.co', 'commercial'),
  ('Adam', 'adam@primmo.co', 'commercial')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Optionnel : événement « Congrès Notaires Cannes (mars 2026) » + démos listing commercial
-- → exécuter séparément : supabase/seed_cannes_2026_demos.sql
-- (régénérer depuis CSV : python3 scripts/generate-cannes-seed.py)
