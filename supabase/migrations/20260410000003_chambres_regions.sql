-- Région dérivée des départements pour les chambres (notary_orgs.type = 'chambre').
-- Chambres interdépartementales : overlap (&&) + présence des deux codes.

UPDATE notary_orgs
SET region = CASE
  WHEN '77' = ANY(departments) AND '89' = ANY(departments) AND departments && ARRAY['77','89']::text[] THEN 'Île-de-France' -- Paris-II 77+89
  WHEN '67' = ANY(departments) AND '68' = ANY(departments) AND departments && ARRAY['67','68']::text[] THEN 'Grand Est' -- Alsace 67+68
  WHEN '2A' = ANY(departments) AND '2B' = ANY(departments) AND departments && ARRAY['2A','2B']::text[] THEN 'Corse' -- Corse 2A+2B
  WHEN '78' = ANY(departments) AND '95' = ANY(departments) AND departments && ARRAY['78','95']::text[] THEN 'Île-de-France' -- Yvelines-VO 78+95
  WHEN departments @> ARRAY['01']::text[] OR departments @> ARRAY['03']::text[] OR departments @> ARRAY['07']::text[] OR departments @> ARRAY['15']::text[] OR departments @> ARRAY['26']::text[] OR departments @> ARRAY['38']::text[] OR departments @> ARRAY['42']::text[] OR departments @> ARRAY['43']::text[] OR departments @> ARRAY['63']::text[] OR departments @> ARRAY['73']::text[] OR departments @> ARRAY['74']::text[] THEN 'Auvergne-Rhône-Alpes'
  WHEN departments @> ARRAY['02']::text[] OR departments @> ARRAY['59']::text[] OR departments @> ARRAY['60']::text[] OR departments @> ARRAY['62']::text[] OR departments @> ARRAY['80']::text[] THEN 'Hauts-de-France'
  WHEN departments @> ARRAY['04']::text[] OR departments @> ARRAY['05']::text[] OR departments @> ARRAY['06']::text[] OR departments @> ARRAY['83']::text[] OR departments @> ARRAY['84']::text[] THEN 'Provence-Alpes-Côte d''Azur'
  WHEN departments @> ARRAY['08']::text[] OR departments @> ARRAY['10']::text[] OR departments @> ARRAY['51']::text[] OR departments @> ARRAY['52']::text[] OR departments @> ARRAY['54']::text[] OR departments @> ARRAY['55']::text[] OR departments @> ARRAY['57']::text[] OR departments @> ARRAY['67']::text[] OR departments @> ARRAY['68']::text[] OR departments @> ARRAY['88']::text[] THEN 'Grand Est'
  WHEN departments @> ARRAY['09']::text[] OR departments @> ARRAY['11']::text[] OR departments @> ARRAY['12']::text[] OR departments @> ARRAY['30']::text[] OR departments @> ARRAY['31']::text[] OR departments @> ARRAY['32']::text[] OR departments @> ARRAY['46']::text[] OR departments @> ARRAY['48']::text[] OR departments @> ARRAY['65']::text[] OR departments @> ARRAY['66']::text[] OR departments @> ARRAY['81']::text[] OR departments @> ARRAY['82']::text[] THEN 'Occitanie'
  WHEN departments @> ARRAY['14']::text[] OR departments @> ARRAY['27']::text[] OR departments @> ARRAY['50']::text[] OR departments @> ARRAY['61']::text[] OR departments @> ARRAY['76']::text[] THEN 'Normandie'
  WHEN departments @> ARRAY['16']::text[] OR departments @> ARRAY['17']::text[] OR departments @> ARRAY['19']::text[] OR departments @> ARRAY['23']::text[] OR departments @> ARRAY['24']::text[] OR departments @> ARRAY['40']::text[] OR departments @> ARRAY['47']::text[] OR departments @> ARRAY['64']::text[] OR departments @> ARRAY['79']::text[] OR departments @> ARRAY['86']::text[] OR departments @> ARRAY['87']::text[] THEN 'Nouvelle-Aquitaine'
  WHEN departments @> ARRAY['18']::text[] OR departments @> ARRAY['28']::text[] OR departments @> ARRAY['36']::text[] OR departments @> ARRAY['37']::text[] OR departments @> ARRAY['41']::text[] OR departments @> ARRAY['45']::text[] THEN 'Centre-Val de Loire'
  WHEN departments @> ARRAY['21']::text[] OR departments @> ARRAY['25']::text[] OR departments @> ARRAY['39']::text[] OR departments @> ARRAY['58']::text[] OR departments @> ARRAY['70']::text[] OR departments @> ARRAY['71']::text[] OR departments @> ARRAY['89']::text[] OR departments @> ARRAY['90']::text[] THEN 'Bourgogne-Franche-Comté'
  WHEN departments @> ARRAY['22']::text[] OR departments @> ARRAY['29']::text[] OR departments @> ARRAY['35']::text[] OR departments @> ARRAY['56']::text[] THEN 'Bretagne'
  WHEN departments @> ARRAY['49']::text[] OR departments @> ARRAY['53']::text[] OR departments @> ARRAY['72']::text[] OR departments @> ARRAY['85']::text[] THEN 'Pays de la Loire'
  WHEN departments @> ARRAY['77']::text[] OR departments @> ARRAY['78']::text[] OR departments @> ARRAY['95']::text[] THEN 'Île-de-France'
  WHEN departments @> ARRAY['2A']::text[] OR departments @> ARRAY['2B']::text[] THEN 'Corse'
  WHEN departments @> ARRAY['971']::text[] THEN 'Guadeloupe'
  WHEN departments @> ARRAY['972']::text[] THEN 'Martinique'
  WHEN departments @> ARRAY['973']::text[] THEN 'Guyane'
  WHEN departments @> ARRAY['974']::text[] THEN 'La Réunion'
  WHEN departments @> ARRAY['975']::text[] THEN 'Saint-Pierre-et-Miquelon'
  WHEN departments @> ARRAY['976']::text[] THEN 'Mayotte'
  ELSE region
END
WHERE type = 'chambre'
  AND departments IS NOT NULL
  AND cardinality(departments) > 0;
