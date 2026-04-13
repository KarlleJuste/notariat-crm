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
