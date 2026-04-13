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
