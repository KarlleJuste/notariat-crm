-- Équipe commerciale Primmo (responsables d’organisations, événements, etc.)
-- Idempotent : réexécuter met à jour les noms si besoin.
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
