-- Permettre aux managers de gérer la table commercials (onboarding équipe)
CREATE POLICY commercials_manager_insert ON commercials FOR INSERT TO authenticated
  WITH CHECK (is_manager());
CREATE POLICY commercials_manager_update ON commercials FOR UPDATE TO authenticated
  USING (is_manager()) WITH CHECK (is_manager());
CREATE POLICY commercials_manager_delete ON commercials FOR DELETE TO authenticated
  USING (is_manager());
