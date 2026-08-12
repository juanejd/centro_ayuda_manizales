-- Seeds comunas and neighborhoods from the verified catalogue in
-- base_verificada_emergencia_sismo_manizales_2026-08-10.md (project root,
-- sections "1. Comunas de Manizales" / "2. Barrios de Manizales"). Both
-- tables were empty until now — the publish/filter forms across the app
-- read from them (listComunas/listNeighborhoods), so this is what actually
-- populates every comuna/barrio dropdown in the product.
--
-- Only the 12 urban comunas: the source document has no verified
-- corregimiento (rural) list, and the TRD is explicit that this catalogue
-- must never be invented. Rural stays empty until a verified list exists.
--
-- ON CONFLICT DO UPDATE makes this safe to re-run if the source document is
-- corrected later.

INSERT INTO comunas (comuna_code, name, kind, sort_order) VALUES
  ('atardeceres',              'Atardeceres',              'urbana', 1),
  ('san-jose',                 'San José',                 'urbana', 2),
  ('cumanday',                 'Cumanday',                 'urbana', 3),
  ('la-estacion',              'La Estación',              'urbana', 4),
  ('ciudadela-del-norte',      'Ciudadela del Norte',      'urbana', 5),
  ('ecoturistico-cerro-de-oro','Ecoturístico Cerro de Oro','urbana', 6),
  ('tesorito',                 'Tesorito',                 'urbana', 7),
  ('palogrande',               'Palogrande',               'urbana', 8),
  ('universitaria',            'Universitaria',            'urbana', 9),
  ('la-fuente',                'La Fuente',                'urbana', 10),
  ('la-macarena',              'La Macarena',               'urbana', 11),
  ('nuevo-horizonte',          'Nuevo Horizonte',          'urbana', 12)
ON CONFLICT (comuna_code) DO UPDATE SET
  name = excluded.name,
  kind = excluded.kind,
  sort_order = excluded.sort_order;

INSERT INTO neighborhoods (neighborhood_code, name, comuna_code) VALUES
  -- Comuna 1 — Atardeceres
  ('la-quinta',              'La Quinta',              'atardeceres'),
  ('la-linda',                'La Linda',               'atardeceres'),
  ('sacatin-viejo',           'Sacatín Viejo',          'atardeceres'),
  ('villa-pilar',             'Villa Pilar',            'atardeceres'),
  ('chipre-viejo',            'Chipre Viejo',           'atardeceres'),
  ('chipre',                  'Chipre',                 'atardeceres'),
  ('campohermoso',            'Campohermoso',           'atardeceres'),
  ('morrogacho',              'Morrogacho',             'atardeceres'),
  ('la-francia',              'La Francia',             'atardeceres'),
  ('los-alcazares',           'Los Alcázares',          'atardeceres'),

  -- Comuna 2 — San José
  ('asis',                    'Asís',                   'san-jose'),
  ('avanzada',                'Avanzada',               'san-jose'),
  ('san-ignacio',             'San Ignacio',            'san-jose'),
  ('galan',                   'Galán',                  'san-jose'),
  ('estrada',                 'Estrada',                'san-jose'),
  ('las-delicias',            'Las Delicias',           'san-jose'),
  ('san-jose-barrio',         'San José',               'san-jose'),
  ('colon',                   'Colón',                  'san-jose'),

  -- Comuna 3 — Cumanday
  ('las-americas',            'Las Américas',           'cumanday'),
  ('los-agustinos',           'Los Agustinos',          'cumanday'),
  ('centro',                  'Centro',                 'cumanday'),
  ('san-joaquin',             'San Joaquín',            'cumanday'),
  ('campoamor',               'Campoamor',              'cumanday'),
  ('fundadores',              'Fundadores',             'cumanday'),

  -- Comuna 4 — La Estación
  ('santa-helena',            'Santa Helena',           'la-estacion'),
  ('san-jorge',               'San Jorge',              'la-estacion'),
  ('el-sol',                  'El Sol',                 'la-estacion'),
  ('la-argentina',            'La Argentina',           'la-estacion'),
  ('la-asuncion',             'La Asunción',            'la-estacion'),
  ('versalles',               'Versalles',              'la-estacion'),
  ('lleras',                  'Lleras',                 'la-estacion'),

  -- Comuna 5 — Ciudadela del Norte
  ('san-sebastian',           'San Sebastián',          'ciudadela-del-norte'),
  ('puertas-del-sol',         'Puertas del Sol',        'ciudadela-del-norte'),
  ('sierra-morena',           'Sierra Morena',          'ciudadela-del-norte'),
  ('el-caribe',               'El Caribe',              'ciudadela-del-norte'),
  ('san-cayetano',            'San Cayetano',           'ciudadela-del-norte'),
  ('bosques-del-norte',       'Bosques del Norte',      'ciudadela-del-norte'),
  ('fanny-gonzalez',          'Fanny González',         'ciudadela-del-norte'),
  ('altos-de-capri',          'Altos de Capri',         'ciudadela-del-norte'),
  ('villa-julia',             'Villa Julia',            'ciudadela-del-norte'),
  ('peralonso',               'Peralonso',              'ciudadela-del-norte'),

  -- Comuna 6 — Ecoturístico Cerro de Oro
  ('viveros',                 'Viveros',                'ecoturistico-cerro-de-oro'),
  ('la-cumbre',               'La Cumbre',              'ecoturistico-cerro-de-oro'),
  ('minitas',                 'Minitas',                'ecoturistico-cerro-de-oro'),
  ('la-sultana',              'La Sultana',             'ecoturistico-cerro-de-oro'),
  ('escuela-de-carabineros',  'Escuela de Carabineros', 'ecoturistico-cerro-de-oro'),
  ('residencias-manizales',   'Residencias Manizales',  'ecoturistico-cerro-de-oro'),
  ('laureles',                'Laureles',               'ecoturistico-cerro-de-oro'),
  ('cerro-de-oro',            'Cerro de Oro',           'ecoturistico-cerro-de-oro'),
  ('alta-suiza',              'Alta Suiza',             'ecoturistico-cerro-de-oro'),
  ('baja-suiza',              'Baja Suiza',             'ecoturistico-cerro-de-oro'),
  ('colseguros',              'Colseguros',             'ecoturistico-cerro-de-oro'),

  -- Comuna 7 — Tesorito
  ('san-marcel',              'San Marcel',             'tesorito'),
  ('la-alhambra',             'La Alhambra',            'tesorito'),
  ('cerros-de-la-alhambra',   'Cerros de la Alhambra',  'tesorito'),
  ('juanchito',               'Juanchito',              'tesorito'),
  ('los-pinos',               'Los Pinos',              'tesorito'),
  ('la-enea',                 'La Enea',                'tesorito'),
  ('lusitania',               'Lusitania',              'tesorito'),
  ('la-nubia',                'La Nubia',               'tesorito'),

  -- Comuna 8 — Palogrande
  ('la-leonora',              'La Leonora',             'palogrande'),
  ('los-rosales',             'Los Rosales',            'palogrande'),
  ('la-rambla',               'La Rambla',              'palogrande'),
  ('palogrande-barrio',       'Palogrande',             'palogrande'),
  ('la-estrella',             'La Estrella',            'palogrande'),
  ('universidad',             'Universidad',            'palogrande'),
  ('belen',                   'Belén',                  'palogrande'),
  ('arboleda',                'Arboleda',               'palogrande'),
  ('palermo',                 'Palermo',                'palogrande'),
  ('sancancio',               'Sancancio',              'palogrande'),
  ('milan',                   'Milán',                  'palogrande'),
  ('el-trebol',               'El Trébol',              'palogrande'),
  ('batallon',                'Batallón',               'palogrande'),

  -- Comuna 9 — Universitaria
  ('betania',                 'Betania',                'universitaria'),
  ('fatima',                  'Fátima',                 'universitaria'),
  ('vivienda-popular',        'Vivienda Popular',       'universitaria'),
  ('pio-xii',                 'Pío XII',                'universitaria'),
  ('san-fernando',            'San Fernando',           'universitaria'),
  ('camilo-torres',           'Camilo Torres',          'universitaria'),
  ('las-colinas',             'Las Colinas',            'universitaria'),
  ('malhabar',                'Malhabar',               'universitaria'),
  ('aranjuez',                'Aranjuez',               'universitaria'),
  ('la-playa',                'La Playa',               'universitaria'),

  -- Comuna 10 — La Fuente
  ('uribe',                   'Uribe',                  'la-fuente'),
  ('velez',                   'Vélez',                  'la-fuente'),
  ('colombia',                'Colombia',               'la-fuente'),
  ('gonzalez',                'González',               'la-fuente'),
  ('persia',                  'Persia',                 'la-fuente'),
  ('guamal',                  'Guamal',                 'la-fuente'),
  ('arrayanes',               'Arrayanes',              'la-fuente'),
  ('marmato',                 'Marmato',                'la-fuente'),
  ('cervantes',               'Cervantes',              'la-fuente'),
  ('nevado',                  'Nevado',                 'la-fuente'),
  ('panamericana',            'Panamericana',           'la-fuente'),

  -- Comuna 11 — La Macarena
  ('san-antonio',             'San Antonio',            'la-macarena'),
  ('20-de-julio',             '20 de Julio',            'la-macarena'),
  ('el-carmen',               'El Carmen',              'la-macarena'),
  ('la-castellana',           'La Castellana',          'la-macarena'),
  ('el-bosque',               'El Bosque',              'la-macarena'),
  ('buena-esperanza',         'Buena Esperanza',        'la-macarena'),
  ('centenario',              'Centenario',             'la-macarena'),
  ('estambul',                'Estambul',               'la-macarena'),

  -- Comuna 12 — Nuevo Horizonte
  ('villahermosa',            'Villahermosa',           'nuevo-horizonte'),
  ('comuneros',                'Comuneros',              'nuevo-horizonte'),
  ('porvenir',                'Porvenir',               'nuevo-horizonte'),
  ('solferino',                'Solferino',              'nuevo-horizonte'),
  ('samaria',                 'Samaria',                'nuevo-horizonte'),
  ('sinai',                   'Sinaí',                  'nuevo-horizonte'),
  ('la-carola',               'La Carola',              'nuevo-horizonte'),
  ('la-carolita',             'La Carolita',            'nuevo-horizonte'),
  ('altos-de-granada',        'Altos de Granada',       'nuevo-horizonte'),
  ('villa-cafe',              'Villa Café',             'nuevo-horizonte'),
  ('porton-del-guamo',        'Portón del Guamo',       'nuevo-horizonte')
ON CONFLICT (neighborhood_code) DO UPDATE SET
  name = excluded.name,
  comuna_code = excluded.comuna_code;
