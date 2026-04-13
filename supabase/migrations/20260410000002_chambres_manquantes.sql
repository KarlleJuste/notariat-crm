-- ============================================================
-- Migration : ajout des 62 chambres manquantes
-- Source : Cartographie_Organisations_Notariat_France.docx (mars 2026)
-- Idempotent : insère uniquement si le nom n'existe pas déjà
-- ============================================================

DO $$
DECLARE
  chambres TEXT[][] := ARRAY[
    -- ARRAY[name, short_name, dept1, dept2, city]  (dept2 vide si mono-dépt)
    ARRAY['Chambre des notaires de l''Ain',                                       'CN Ain',                '01',  '',    'Bourg-en-Bresse'],
    ARRAY['Chambre des notaires de l''Aisne',                                     'CN Aisne',              '02',  '',    'Laon'],
    ARRAY['Chambre des notaires de l''Allier',                                    'CN Allier',             '03',  '',    'Moulins'],
    ARRAY['Chambre des notaires des Alpes-de-Haute-Provence',                     'CN Alpes-HP',           '04',  '',    'Digne-les-Bains'],
    ARRAY['Chambre des notaires des Hautes-Alpes',                                'CN Hautes-Alpes',       '05',  '',    'Gap'],
    ARRAY['Chambre des notaires des Alpes-Maritimes',                             'CN Alpes-Maritimes',    '06',  '',    'Nice'],
    ARRAY['Chambre des notaires de l''Ardèche',                                   'CN Ardèche',            '07',  '',    'Privas'],
    ARRAY['Chambre des notaires des Ardennes',                                    'CN Ardennes',           '08',  '',    'Charleville-Mézières'],
    ARRAY['Chambre des notaires de l''Ariège',                                    'CN Ariège',             '09',  '',    'Foix'],
    ARRAY['Chambre des notaires de l''Aube',                                      'CN Aube',               '10',  '',    'Troyes'],
    ARRAY['Chambre des notaires de l''Aude',                                      'CN Aude',               '11',  '',    'Carcassonne'],
    ARRAY['Chambre des notaires de l''Aveyron',                                   'CN Aveyron',            '12',  '',    'Rodez'],
    ARRAY['Chambre des notaires du Calvados',                                     'CN Calvados',           '14',  '',    'Caen'],
    ARRAY['Chambre des notaires du Cantal',                                       'CN Cantal',             '15',  '',    'Aurillac'],
    ARRAY['Chambre des notaires de la Charente',                                  'CN Charente',           '16',  '',    'Angoulême'],
    ARRAY['Chambre des notaires de la Charente-Maritime',                         'CN Charente-Maritime',  '17',  '',    'La Rochelle'],
    ARRAY['Chambre des notaires du Cher',                                         'CN Cher',               '18',  '',    'Bourges'],
    ARRAY['Chambre des notaires de la Corrèze',                                   'CN Corrèze',            '19',  '',    'Tulle'],
    ARRAY['Chambre interdép. des notaires de Corse',                              'CN Corse',              '2A',  '2B',  'Ajaccio'],
    ARRAY['Chambre des notaires de la Côte-d''Or',                                'CN Côte-d''Or',         '21',  '',    'Dijon'],
    ARRAY['Chambre des notaires des Côtes-d''Armor',                              'CN Côtes-d''Armor',     '22',  '',    'Saint-Brieuc'],
    ARRAY['Chambre des notaires de la Creuse',                                    'CN Creuse',             '23',  '',    'Guéret'],
    ARRAY['Chambre des notaires de la Dordogne',                                  'CN Dordogne',           '24',  '',    'Périgueux'],
    ARRAY['Chambre des notaires du Doubs',                                        'CN Doubs',              '25',  '',    'Besançon'],
    ARRAY['Chambre des notaires de la Drôme',                                     'CN Drôme',              '26',  '',    'Valence'],
    ARRAY['Chambre des notaires de l''Eure',                                      'CN Eure',               '27',  '',    'Évreux'],
    ARRAY['Chambre des notaires d''Eure-et-Loir',                                 'CN Eure-et-Loir',       '28',  '',    'Chartres'],
    ARRAY['Chambre des notaires du Finistère',                                    'CN Finistère',          '29',  '',    'Quimper'],
    ARRAY['Chambre des notaires du Gard',                                         'CN Gard',               '30',  '',    'Nîmes'],
    ARRAY['Chambre des notaires de la Haute-Garonne',                             'CN Haute-Garonne',      '31',  '',    'Toulouse'],
    ARRAY['Chambre des notaires du Gers',                                         'CN Gers',               '32',  '',    'Auch'],
    ARRAY['Chambre des notaires d''Ille-et-Vilaine',                              'CN Ille-et-Vilaine',    '35',  '',    'Rennes'],
    ARRAY['Chambre des notaires de l''Indre',                                     'CN Indre',              '36',  '',    'Châteauroux'],
    ARRAY['Chambre des notaires d''Indre-et-Loire',                               'CN Indre-et-Loire',     '37',  '',    'Tours'],
    ARRAY['Chambre des notaires de l''Isère',                                     'CN Isère',              '38',  '',    'Grenoble'],
    ARRAY['Chambre des notaires du Jura',                                         'CN Jura',               '39',  '',    'Lons-le-Saunier'],
    ARRAY['Chambre des notaires des Landes',                                      'CN Landes',             '40',  '',    'Mont-de-Marsan'],
    ARRAY['Chambre des notaires de Loir-et-Cher',                                 'CN Loir-et-Cher',       '41',  '',    'Blois'],
    ARRAY['Chambre des notaires de la Loire',                                     'CN Loire',              '42',  '',    'Saint-Étienne'],
    ARRAY['Chambre des notaires de la Haute-Loire',                               'CN Haute-Loire',        '43',  '',    'Le Puy-en-Velay'],
    ARRAY['Chambre des notaires du Loiret',                                       'CN Loiret',             '45',  '',    'Orléans'],
    ARRAY['Chambre des notaires du Lot',                                          'CN Lot',                '46',  '',    'Cahors'],
    ARRAY['Chambre des notaires du Lot-et-Garonne',                               'CN Lot-et-Garonne',     '47',  '',    'Agen'],
    ARRAY['Chambre des notaires de la Lozère',                                    'CN Lozère',             '48',  '',    'Mende'],
    ARRAY['Chambre des notaires du Maine-et-Loire',                               'CN Maine-et-Loire',     '49',  '',    'Angers'],
    ARRAY['Chambre des notaires de la Manche',                                    'CN Manche',             '50',  '',    'Saint-Lô'],
    ARRAY['Chambre des notaires de la Marne',                                     'CN Marne',              '51',  '',    'Châlons-en-Champagne'],
    ARRAY['Chambre des notaires de la Haute-Marne',                               'CN Haute-Marne',        '52',  '',    'Chaumont'],
    ARRAY['Chambre des notaires de la Mayenne',                                   'CN Mayenne',            '53',  '',    'Laval'],
    ARRAY['Chambre des notaires de Meurthe-et-Moselle',                           'CN Meurthe-et-Moselle', '54',  '',    'Nancy'],
    ARRAY['Chambre des notaires de la Meuse',                                     'CN Meuse',              '55',  '',    'Bar-le-Duc'],
    ARRAY['Chambre des notaires du Morbihan',                                     'CN Morbihan',           '56',  '',    'Vannes'],
    ARRAY['Chambre des notaires de la Moselle',                                   'CN Moselle',            '57',  '',    'Metz'],
    ARRAY['Chambre des notaires de la Nièvre',                                    'CN Nièvre',             '58',  '',    'Nevers'],
    ARRAY['Chambre des notaires de l''Oise',                                      'CN Oise',               '60',  '',    'Beauvais'],
    ARRAY['Chambre des notaires de l''Orne',                                      'CN Orne',               '61',  '',    'Alençon'],
    ARRAY['Chambre des notaires du Pas-de-Calais',                                'CN Pas-de-Calais',      '62',  '',    'Arras'],
    ARRAY['Chambre des notaires du Puy-de-Dôme',                                  'CN Puy-de-Dôme',        '63',  '',    'Clermont-Ferrand'],
    ARRAY['Chambre des notaires des Pyrénées-Atlantiques',                        'CN Pyrénées-Atl.',      '64',  '',    'Pau'],
    ARRAY['Chambre des notaires des Hautes-Pyrénées',                             'CN Hautes-Pyrénées',    '65',  '',    'Tarbes'],
    ARRAY['Chambre des notaires des Pyrénées-Orientales',                         'CN Pyrénées-Or.',       '66',  '',    'Perpignan'],
    ARRAY['Chambre interdép. des notaires d''Alsace',                             'CN Alsace',             '67',  '68',  'Strasbourg'],
    ARRAY['Chambre des notaires de la Haute-Saône',                               'CN Haute-Saône',        '70',  '',    'Vesoul'],
    ARRAY['Chambre des notaires de Saône-et-Loire',                               'CN Saône-et-Loire',     '71',  '',    'Mâcon'],
    ARRAY['Chambre des notaires de la Sarthe',                                    'CN Sarthe',             '72',  '',    'Le Mans'],
    ARRAY['Chambre des notaires de la Savoie',                                    'CN Savoie',             '73',  '',    'Chambéry'],
    ARRAY['Chambre des notaires de la Haute-Savoie',                              'CN Haute-Savoie',       '74',  '',    'Annecy'],
    ARRAY['Chambre des notaires de la Seine-Maritime',                            'CN Seine-Maritime',     '76',  '',    'Rouen'],
    ARRAY['Chambre interdép. des notaires de Paris-II',                           'CN Paris-II',           '77',  '89',  'Melun'],
    ARRAY['Chambre interdép. des notaires des Yvelines et du Val-d''Oise',        'CN Yvelines-VO',        '78',  '95',  'Versailles'],
    ARRAY['Chambre des notaires des Deux-Sèvres',                                 'CN Deux-Sèvres',        '79',  '',    'Niort'],
    ARRAY['Chambre des notaires de la Somme',                                     'CN Somme',              '80',  '',    'Amiens'],
    ARRAY['Chambre des notaires du Tarn',                                         'CN Tarn',               '81',  '',    'Albi'],
    ARRAY['Chambre des notaires du Tarn-et-Garonne',                              'CN Tarn-et-Garonne',    '82',  '',    'Montauban'],
    ARRAY['Chambre des notaires du Var',                                          'CN Var',                '83',  '',    'Toulon'],
    ARRAY['Chambre des notaires du Vaucluse',                                     'CN Vaucluse',           '84',  '',    'Avignon'],
    ARRAY['Chambre des notaires de la Vendée',                                    'CN Vendée',             '85',  '',    'La Roche-sur-Yon'],
    ARRAY['Chambre des notaires de la Vienne',                                    'CN Vienne',             '86',  '',    'Poitiers'],
    ARRAY['Chambre des notaires de la Haute-Vienne',                              'CN Haute-Vienne',       '87',  '',    'Limoges'],
    ARRAY['Chambre des notaires des Vosges',                                      'CN Vosges',             '88',  '',    'Épinal'],
    ARRAY['Chambre des notaires de l''Yonne',                                     'CN Yonne',              '89',  '',    'Auxerre'],
    ARRAY['Chambre des notaires du Territoire de Belfort',                        'CN Belfort',            '90',  '',    'Belfort'],
    ARRAY['Chambre des notaires de la Guadeloupe',                                'CN Guadeloupe',         '971', '',    'Basse-Terre'],
    ARRAY['Chambre des notaires de la Martinique',                                'CN Martinique',         '972', '',    'Fort-de-France'],
    ARRAY['Chambre des notaires de la Guyane',                                    'CN Guyane',             '973', '',    'Cayenne'],
    ARRAY['Chambre des notaires de La Réunion',                                   'CN La Réunion',         '974', '',    'Saint-Denis'],
    ARRAY['Chambre des notaires de Saint-Pierre-et-Miquelon',                     'CN SPM',                '975', '',    'Saint-Pierre'],
    ARRAY['Chambre des notaires de Mayotte',                                      'CN Mayotte',            '976', '',    'Mamoudzou']
  ];
  c TEXT[];
  depts TEXT[];
BEGIN
  FOREACH c SLICE 1 IN ARRAY chambres LOOP
    -- skip si déjà en base
    IF NOT EXISTS (SELECT 1 FROM notary_orgs WHERE name = c[1]) THEN
      -- construire le tableau departments (sans valeur vide)
      IF c[4] = '' THEN
        depts := ARRAY[c[3]];
      ELSE
        depts := ARRAY[c[3], c[4]];
      END IF;
      INSERT INTO notary_orgs (name, short_name, type, departments, city, crm_status)
      VALUES (c[1], c[2], 'chambre', depts, c[5], 'prospect');
    END IF;
  END LOOP;
END;
$$;

-- Vérification
SELECT COUNT(*) AS total_chambres FROM notary_orgs WHERE type = 'chambre';
