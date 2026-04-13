-- Les commerciaux assignés à un événement voient toutes les démos de cet événement
-- (pas seulement celles où commercial_id = leur id — utile après import HubSpot).
DROP POLICY IF EXISTS demos_select ON demos;
CREATE POLICY demos_select ON demos FOR SELECT TO authenticated USING (
  is_manager()
  OR commercial_id = my_commercial_id()
  OR EXISTS (
    SELECT 1
    FROM event_commercials ec
    WHERE ec.event_id = demos.event_id
      AND ec.commercial_id = my_commercial_id()
  )
);
