-- Événement Cannes mars 2026 + 77 démos (listing commercial)
-- Prérequis : commercials (Karl, Juliette, Quentin) + migrations initiales.
-- hubspot_deal_id = IMPORT-CANNES-* (placeholders). Remplacer par les vrais Record IDs HubSpot,
-- puis « Rafraîchir depuis HubSpot » sur la fiche événement pour stage / deal.
-- MRR Stripe : rempli par sync Stripe (email contact) ou manuellement.
--
-- Mapping colonnes CRM :
--   date_reservation → demos.created_at (midi UTC)
--   date_demo       → demos.close_date
--   stade HubSpot   → demos.stage (après refresh API)
--   MRR             → demos.stripe_mrr (après sync Stripe)

BEGIN;

INSERT INTO events (name, type, date, location, status, notes)
SELECT 'Congrès Notaires Cannes (mars 2026)', 'salon_congres', DATE '2026-03-22', 'Cannes', 'termine',
  'Import listing mars 2026. IDs deal factices IMPORT-CANNES-* jusqu’à synchro HubSpot.'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Congrès Notaires Cannes (mars 2026)');

INSERT INTO event_commercials (event_id, commercial_id)
SELECT e.id, c.id
FROM events e
CROSS JOIN commercials c
WHERE e.name = 'Congrès Notaires Cannes (mars 2026)'
  AND c.name IN ('Karl', 'Juliette', 'Quentin')
ON CONFLICT DO NOTHING;

INSERT INTO demos (
  hubspot_deal_id, event_id, commercial_id,
  contact_email, contact_name, contact_company, deal_name,
  close_date, created_at, stage, raw_data
)
SELECT
  v.hubspot_deal_id,
  e.id,
  c.id,
  v.email,
  v.contact_name,
  NULL::text,
  v.deal_name,
  v.close_date::date,
  v.created_at::timestamptz,
  '1st demo booked',
  v.raw_data::jsonb
FROM (VALUES
    ('IMPORT-CANNES-a6398caf3de24c01', 'Karl', 'marie.lauque-bourquin@83116.notaires.fr', 'Marie-Lauque Bourquin', 'Marie-Lauque Bourquin — Cannes 2026', '2026-03-27', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-03-27", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-46ba80d71cd071c0', 'Karl', 'laurence.zilic-balay@43-75.notaires.fr', 'Laurence ZILIC BALAY', 'Laurence ZILIC BALAY — Cannes 2026', '2026-04-22', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-04-22", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-8ae7f1e8b3724fa0', 'Karl', 'jules.marzin@notaires.fr', 'Jules Marzin', 'Jules Marzin — Cannes 2026', '2026-03-27', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-03-27", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-bd02b8982b69b56c', 'Karl', 'faustine.pessia@notaires.fr', 'Faustine Pessia', 'Faustine Pessia — Cannes 2026', '2026-04-13', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-04-13", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-3cadca7f731cb3d3', 'Karl', 'mathieu.bec@notaires.fr', 'Mathieu Bec', 'Mathieu Bec — Cannes 2026', '2026-04-02', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-04-02", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-f1ae7888dcfab826', 'Karl', 'albane.thery@43-75.notaires.fr', 'Albane Thery', 'Albane Thery — Cannes 2026', '2026-04-22', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-04-22", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-87177fd6ffb5f4c2', 'Karl', 'anne-sophie.arnal@valparis.notaires.fr', 'Anne-Sophie ARNAL', 'Anne-Sophie ARNAL — Cannes 2026', '2026-03-23', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-03-23", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-f00752d96f0e59aa', 'Karl', 'nathalie.legall@78199.notaires.fr', 'Nathalie Le Gall', 'Nathalie Le Gall — Cannes 2026', '2026-04-13', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-04-13", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-7f8f1bba27da46db', 'Karl', 'caroline.oron@notaires.fr', 'Caroline Oron', 'Caroline Oron — Cannes 2026', '2026-04-27', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-27", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-fda8c98e76fa94d5', 'Karl', 'marc.girard@06035.notaires.fr', 'Marc Girard', 'Marc Girard — Cannes 2026', '2026-04-14', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-14", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-f2cecd2a1fdcbe9e', 'Karl', 'peggy.montesinos@notaires.fr', 'Peggy Montesinos', 'Peggy Montesinos — Cannes 2026', '2026-04-08', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-08", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-f34d9281211d6c5a', 'Karl', 'stephane.paolino@06035.notaires.fr', 'Stéphane PAOLINO', 'Stéphane PAOLINO — Cannes 2026', '2026-04-14', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-14", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-6d3718da08b9c5f0', 'Karl', 'nicolas.delouis@paris.notaires.fr', 'Nicolas Delouis', 'Nicolas Delouis — Cannes 2026', '2026-04-08', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-08", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-729d6729567f9ee8', 'Karl', 'nubia.scudo@06035.notaires.fr', 'Nubia Scudo', 'Nubia Scudo — Cannes 2026', '2026-04-14', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-14", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-b4450c695094f5db', 'Karl', 'bruno.vaginay.04010@notaires.fr', 'Bruno Vaginay', 'Bruno Vaginay — Cannes 2026', '2026-04-08', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-08", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-81757ec6e0bbe333', 'Karl', 'arnaud.barousse@31053.notaires.fr', 'Arnaud Barousse', 'Arnaud Barousse — Cannes 2026', '2026-05-11', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-05-11", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-92f36b2ff430efa1', 'Karl', 'stephane.paolino@notaires.fr', 'Stéphane PAOLINO', 'Stéphane PAOLINO — Cannes 2026', '2026-04-14', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-14", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-0010e5845b52325c', 'Karl', 'laetitia.jossier@cbj.notaires.fr', 'Laetitia JOSSIER-ROBOT', 'Laetitia JOSSIER-ROBOT — Cannes 2026', '2026-05-05', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-05-05", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-dc17764bf230a94e', 'Karl', 'roxane.bignell@06035.notaires.fr', 'Roxane Bignell', 'Roxane Bignell — Cannes 2026', '2026-04-14', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-14", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-4ee3955e4deeea48', 'Karl', 'elodie.triollier@cbj.notaires.fr', 'Elodie Triollier', 'Elodie Triollier — Cannes 2026', '2026-05-05', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-05-05", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-30d6213f8279502c', 'Karl', 'eloise.rigaudier@cbj.notaires.fr', 'Eloise Rigaudier', 'Eloise Rigaudier — Cannes 2026', '2026-05-05', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-05-05", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-2e6581bde9fbcb2e', 'Karl', 'severine.roze@roze.notaires.fr', 'Séverine Roze', 'Séverine Roze — Cannes 2026', '2026-05-12', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-05-12", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-aa7ca1e3585ce6c8', 'Karl', 'pierre.girard@inference.notaires.fr', 'Pierre Girard', 'Pierre Girard — Cannes 2026', '2026-04-09', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-09", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-da495e77f8018a1e', 'Karl', 'anne-sophie.arnal@valparis.notaires.fr', 'Anne-Sophie ARNAL', 'Anne-Sophie ARNAL — Cannes 2026', '2026-03-30', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-03-30", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-24d70ac1784e2f52', 'Karl', 'caroline.courtiade@notaires.fr', 'Caroline Courtiade', 'Caroline Courtiade — Cannes 2026', '2026-04-27', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-27", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-70ce452c44832273', 'Karl', 'charles-alexandre.schultz@notaires.fr', 'Charles-Alexandre Schultz', 'Charles-Alexandre Schultz — Cannes 2026', '2026-04-30', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-30", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-11180645e35c15af', 'Karl', 'sophie.borg@notaires.fr', 'Sophie Borg', 'Sophie Borg — Cannes 2026', '2026-05-04', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-05-04", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-a3225080bcb6dbae', 'Karl', 'thierry.eveillard@85090.notaires.fr', 'Thierry Eveillard', 'Thierry Eveillard — Cannes 2026', '2026-04-28', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-28", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-dd8f35a666d369d0', 'Karl', 'broudeur@notaires.fr', 'Marie-Agnes Broudeur', 'Marie-Agnes Broudeur — Cannes 2026', '2026-05-06', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-05-06", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-cfd4693d677fe13c', 'Karl', 's.lopes-grajzgrund@officedu21.notaires.fr', 'Sylvie LOPES-GRAJZGRUND', 'Sylvie LOPES-GRAJZGRUND — Cannes 2026', '2026-04-24', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-24", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-b624101f730f2390', 'Karl', 'w.ridouan-allali@officedu21.notaires.fr', 'Wafaa Redouane', 'Wafaa Redouane — Cannes 2026', '2026-04-24', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-24", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-da893aef5126a5eb', 'Karl', 'contact@gin44.fr', 'Laetitia Lelong', 'Laetitia Lelong — Cannes 2026', '2026-04-14', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-14", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-2c9839497b23a29f', 'Karl', 'florence.savoy@13155.notaires.fr', 'Florence Savoy', 'Florence Savoy — Cannes 2026', '2026-04-23', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-23", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-cb5b6dd9a949743f', 'Karl', 'sandrine.meyssan@meyssan.notaires.fr', 'Sandrine Meyssan', 'Sandrine Meyssan — Cannes 2026', '2026-05-11', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-05-11", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-9642fc519560023e', 'Karl', 'delphine.moreau@notaires.fr', 'Delphine Moreau', 'Delphine Moreau — Cannes 2026', '2026-04-23', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-23", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-5376c8ea43568cb7', 'Karl', 'elise-anne.magret@notaires.fr', 'Elise-Anne Magret', 'Elise-Anne Magret — Cannes 2026', '2026-03-27', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-03-27", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-b8630f3ed94c798d', 'Karl', 'catherine.guegan@guegan.notaires.fr', 'Catherine Guegan', 'Catherine Guegan — Cannes 2026', '2026-04-01', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-01", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-eca8f0696b17d05a', 'Karl', 'are@conseil-et-notaire.fr', 'Antoine de RAVEL d''ESCLAPON', 'Antoine de RAVEL d''ESCLAPON — Cannes 2026', '2026-05-04', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-05-04", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-20c2b95d3fc559a6', 'Karl', 'pierre-jean.meyssan@meyssan.notaires.fr', 'Pierre Jean Meyssan', 'Pierre Jean Meyssan — Cannes 2026', '2026-05-11', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-05-11", "commercial_label": "Karl"}'),
    ('IMPORT-CANNES-8c72b9e69249c275', 'Juliette', 'olivier.besancon@besanconseguin.notaires.fr', 'Olivier Besançon', 'Olivier Besançon — Cannes 2026', '2026-05-05', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-05-05", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-fb31ee1f997238a5', 'Juliette', 'fabien.seguin@besanconseguin.notaires.fr', 'Fabien SEGUIN', 'Fabien SEGUIN — Cannes 2026', '2026-05-05', '2026-03-22T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-22", "date_demo": "2026-05-05", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-5b8a3b31af32e661', 'Juliette', 'rocher.emmanuelle@13185.notaires.fr', 'Emmanuelle Rocher', 'Emmanuelle Rocher — Cannes 2026', '2026-04-30', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-30", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-561459178a830ac6', 'Juliette', 'nicolas.comte@notaires.fr', 'Nicolas Comte', 'Nicolas Comte — Cannes 2026', '2026-04-15', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-15", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-f3d4e0bf524b12cd', 'Juliette', 'sylvie.tudes@notaires.fr', 'Sylvie Tudes', 'Sylvie Tudes — Cannes 2026', '2026-03-31', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-03-31", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-8f05d46a5aaf0a90', 'Juliette', 'amaury.boudrot@etude-boudrot.notaires.fr', 'Amaury Boudrot', 'Amaury Boudrot — Cannes 2026', '2026-04-15', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-15", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-5d795faeff39bb84', 'Juliette', 'christel.hoerter@notaires.fr', 'Christel Hoerter', 'Christel Hoerter — Cannes 2026', '2026-04-07', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-07", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-48a91463b9b46595', 'Juliette', 'derouetclement@gmail.com', 'Clement Derouet', 'Clement Derouet — Cannes 2026', '2026-03-24', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-03-24", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-01a72d76464202d3', 'Juliette', 'cecile.perrault@05001.notaires.fr', 'CECILE PERRAULT', 'CECILE PERRAULT — Cannes 2026', '2026-04-09', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-09", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-e6383b5c7c72ce9e', 'Juliette', 'chloe.jean@33059.notaires.fr', 'Chloé JEAN', 'Chloé JEAN — Cannes 2026', '2026-04-13', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-13", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-332115131a63f1dc', 'Juliette', 'steven.guerin@97116.notaires.fr', 'Steven Guerin', 'Steven Guerin — Cannes 2026', '2026-03-27', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-03-27", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-bd332124c0c80511', 'Juliette', 'anthony.savale@latelier.notaires.fr', 'Anthony SAVALE', 'Anthony SAVALE — Cannes 2026', '2026-04-07', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-07", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-3faaa572ea4bd04f', 'Juliette', 'benoit.lamy@notaires.fr', 'Benoit Lamy', 'Benoit Lamy — Cannes 2026', '2026-04-03', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-03", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-cd24dfc99caf4cd6', 'Juliette', 'nancy.rosas@notaires.fr', 'Nancy Rosas', 'Nancy Rosas — Cannes 2026', '2026-04-02', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-02", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-52fec3063ce7edf4', 'Juliette', 'julie.retout@notaires.fr', 'Julie Retout', 'Julie Retout — Cannes 2026', '2026-04-22', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-22", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-323a9dc52756e98e', 'Juliette', 'sebastien.serremoune@74041.notaires.fr', 'Sebastien SERREMOÛNE', 'Sebastien SERREMOÛNE — Cannes 2026', '2026-04-23', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-23", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-3d01a39bf241e626', 'Juliette', 'frederic.anselm@acto.notaires.fr', 'Frederic Anselm', 'Frederic Anselm — Cannes 2026', '2026-04-01', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-01", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-da225b5c461930d5', 'Juliette', 'elise.decourt-bellin@etudenapoleon.notaires.fr', 'Elise Decourt-Bellin', 'Elise Decourt-Bellin — Cannes 2026', '2026-04-09', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-09", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-d57f4c3cd4d1bcc9', 'Juliette', 'stephane.rambaud@13ruedeparis.notaires.fr', 'Stéphane Rambaud', 'Stéphane Rambaud — Cannes 2026', '2026-04-15', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-15", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-db17953fe0ee5a2c', 'Juliette', 'sandrine.billod@billod.notaires.fr', 'Sandrine BILLOD', 'Sandrine BILLOD — Cannes 2026', '2026-04-16', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-16", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-f3d5853082de7e2f', 'Juliette', 'n.bogdanova@notaires.fr', 'Natalia Bogdanova Pataud', 'Natalia Bogdanova Pataud — Cannes 2026', '2026-03-30', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-03-30", "commercial_label": "Juliette"}'),
    ('IMPORT-CANNES-0b9ea714a7a92c84', 'Quentin', 'elise-anne.magret@notaires.fr', 'Elise-Anne Magret', 'Elise-Anne Magret — Cannes 2026', '2026-04-13', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-13", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-eca32ccb29a14377', 'Quentin', 'julien.guennec@lawriant.notaires.fr', 'Julien Guennec', 'Julien Guennec — Cannes 2026', '2026-03-25', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-03-25", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-8969ef82edcea3dc', 'Quentin', 'isabelle.kuhn-magret@notaires.fr', 'Isabelle kuhn-magret', 'Isabelle kuhn-magret — Cannes 2026', '2026-04-13', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-13", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-27f4cbf372d2548f', 'Quentin', 'marion.coyola@notaires.fr', 'Marion Coyola', 'Marion Coyola — Cannes 2026', '2026-04-15', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-15", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-76ba277cb3e3b8fb', 'Quentin', 'anne.schmidt@notaires.fr', 'Anne Schmidt', 'Anne Schmidt — Cannes 2026', '2026-05-05', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-05-05", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-c44bf5eb6d488e17', 'Quentin', 'philippe.cherrier@notaires.fr', 'Philippe Cherrier', 'Philippe Cherrier — Cannes 2026', '2026-04-13', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-13", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-48b361b978aca46e', 'Quentin', 'charles-alexandre.schultz@notaires.fr', 'Charles-Alexandre Schultz', 'Charles-Alexandre Schultz — Cannes 2026', '2026-04-13', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-04-13", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-fda479f8aed0e866', 'Quentin', 'alexandra.mignon-guzmann@notaires.fr', 'Alexandra Mignon-Guzmann', 'Alexandra Mignon-Guzmann — Cannes 2026', '2026-03-30', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-03-30", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-1a4dc16fe89fc96f', 'Quentin', 'guillaume.valluche@notaires.fr', 'Guillaume Valluche', 'Guillaume Valluche — Cannes 2026', '2026-03-31', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-03-31", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-61612eb3d65e74c6', 'Quentin', 'caroline.duluc@38216.notaires.fr', 'Caroline Duluc', 'Caroline Duluc — Cannes 2026', '2026-03-30', '2026-03-23T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-23", "date_demo": "2026-03-30", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-db06abb07b29d954', 'Quentin', 'patrick.legrigeois@flv.notaires.fr', 'Patrick Legrigeois', 'Patrick Legrigeois — Cannes 2026', '2026-04-03', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-03", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-2f8f2d389ee34ca4', 'Quentin', 'francoise.noharet@notaires.fr', 'Françoise Noharet', 'Françoise Noharet — Cannes 2026', '2026-04-20', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-20", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-257a3982acc01a7f', 'Quentin', 'philippe.bernard@notaires.fr', 'Philippe Bernard', 'Philippe Bernard — Cannes 2026', '2026-04-20', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-20", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-d1928a627e5b3785', 'Quentin', 'j.pinget@notaires.fr', 'Justine Pinget', 'Justine Pinget — Cannes 2026', '2026-04-17', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-17", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-38c2ae53713fec78', 'Quentin', 'yann.legros@notaires.fr', 'Yann Legros', 'Yann Legros — Cannes 2026', '2026-04-20', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-20", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-a8139a6ca4e64318', 'Quentin', 'jean-marc.brun@cairn.notaires.fr', 'Jean-Marc Brun', 'Jean-Marc Brun — Cannes 2026', '2026-04-03', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-03", "commercial_label": "Quentin"}'),
    ('IMPORT-CANNES-30c0451fddb75109', 'Quentin', 'isabelle.kuhn-magret@notaires.fr', 'Isabelle kuhn-magret', 'Isabelle kuhn-magret — Cannes 2026', '2026-04-07', '2026-03-24T12:00:00Z', '{"import": "cannes_mar_2026", "date_reservation": "2026-03-24", "date_demo": "2026-04-07", "commercial_label": "Quentin"}')
) AS v(hubspot_deal_id, commercial_name, email, contact_name, deal_name, close_date, created_at, raw_data)
JOIN events e ON e.name = 'Congrès Notaires Cannes (mars 2026)'
JOIN commercials c ON c.name = v.commercial_name
ON CONFLICT (hubspot_deal_id) DO NOTHING;

COMMIT;
