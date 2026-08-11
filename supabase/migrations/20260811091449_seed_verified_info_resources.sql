-- =============================================================================
-- Centro de Ayuda Manizales — info_resources seed (TRD §12.7, phase 1 unit 1.9)
--
-- Every row below is transcribed from
-- base_verificada_emergencia_sismo_manizales_2026-08-10.md, whose own
-- verification cut-off is 2026-08-10 23:05 COT. Nothing here is inferred,
-- completed or rounded off: where the document declares a gap, the column stays
-- NULL and the interface renders the RI-5 sentence instead.
--
-- This lives in a migration rather than supabase/seed.sql because the project
-- applies schema AND data to a hosted project through migration history;
-- db.seed.enabled only ever runs on a local `supabase db reset`.
--
-- The publication rules this file has to satisfy (TRD §6.1) are not style:
--   RI-1  Only the shelter the balance names is published. The other two
--         enabled shelters exist in the official count but are unnamed, so no
--         address of ours may stand in for them.
--   RI-2  "Presenta afectaciones" is not "cerrado". Hospital Santa Sofía is
--         seeded as pending confirmation, never as closed.
--   RI-3  §8 of the source names casualties. None of it is seeded.
--   RI-4  The only road/mobility closure with an official statement is the
--         Cable Aéreo. Kilómetro 41 and the urban network are not seeded.
--   RI-5  A gap stays NULL, or is stated as a gap in the description.
--   RI-6  source and verified_at are NOT NULL on every single row.
--
-- Status mapping, from the source document's own traffic-light classification:
--   🟢 confirmed by an official source        -> 'verificado'
--   🟡 announced, official detail missing     -> 'pendiente'
--   out of service by official statement      -> 'cerrado'
-- 'cerrado' is a fact about the world, not an editorial state: those rows stay
-- published and visible (RF-5.8). is_published = false is the editorial state,
-- and it is used exactly once here, for the shelter that was announced only as
-- a contingency.
--
-- Phone strings are stored exactly as the municipal directory writes them,
-- menu option included. toDialable() in src/modules/info-resources/domain.ts
-- strips the option at render time; concatenating it here would produce 1232,
-- a number that does not exist (RF-5.5).
-- =============================================================================

INSERT INTO info_resources (
  slug, category, name, description, address, meeting_point,
  phones, hours, source, status, verified_at, is_published
)
SELECT
  seed.slug,
  seed.category,
  seed.name,
  seed.description,
  seed.address,
  seed.meeting_point,
  seed.phones,
  seed.hours,
  seed.source,
  seed.status,
  -- RI-6. One timestamp for every row, because one document verified them all
  -- at the same cut-off. Claiming individual verification times we do not have
  -- would be the same class of invention as inventing an address.
  TIMESTAMPTZ '2026-08-10 23:05:00-05',
  seed.is_published
FROM (VALUES

  -- ===========================================================================
  -- §3 Líneas de emergencia + §11 Apoyo psicosocial -> lineas_atencion
  -- ===========================================================================

  (
    'linea-unica-de-emergencias-123',
    'lineas_atencion',
    'Sistema Único de Emergencias 123',
    'Línea única de emergencias de Manizales para cualquier situación que ponga en riesgo la vida, la salud o los bienes. El menú dirige la llamada: opción 1 Policía Nacional, opción 2 urgencias médicas, opción 3 salud mental y equidad de género, opción 4 emergencias bomberiles, opción 5 protección animal. El dígito de la opción no se marca junto al número: marque 123 y espere el menú.',
    NULL::text,
    NULL::text,
    ARRAY['123']::text[],
    '24 horas, todos los días'::text,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/vicepresidente-jose-manuel-restrepo-conoce-balance-de-afectaciones-por-sismo-en-manizales/',
    'verificado',
    true
  ),
  (
    'policia-nacional-manizales',
    'lineas_atencion',
    'Policía Nacional',
    'Seguridad, hechos delictivos y apoyo policial. Se atiende por la opción 1 del menú de la línea 123 y también por la línea 153 del directorio municipal.',
    NULL,
    NULL,
    ARRAY['123 opción 1', '153'],
    '24 horas, todos los días',
    'Directorio municipal de emergencias 2026, Alcaldía de Manizales',
    'verificado',
    true
  ),
  (
    'sistema-de-emergencias-medicas',
    'lineas_atencion',
    'Sistema de Emergencias Médicas',
    'Ruta recomendada para una urgencia médica. Coordina la teleasistencia, el despacho de ambulancias y el traslado al prestador adecuado. Se atiende por la opción 2 del menú de la línea 123. En atención de urgencias no se requiere autorización administrativa previa entre el prestador y el asegurador para acceder al servicio.',
    NULL,
    NULL,
    ARRAY['123 opción 2'],
    '24 horas, todos los días del año',
    'Secretaría de Salud de Manizales — https://salud.manizales.gov.co/sistema-de-emergencias-medicas/',
    'verificado',
    true
  ),
  (
    'linea-de-salud-mental-y-equidad-de-genero',
    'lineas_atencion',
    'Línea de Salud Mental y Equidad de Género',
    'Atención en crisis emocional, ansiedad, miedo y acompañamiento psicológico, además de la ruta de atención en equidad de género. Se atiende por la opción 3 del menú de la línea 123. Tras el sismo la Secretaría de Salud Pública activó acompañamiento en salud mental articulado con la Universidad de Manizales, la IPS Plenamente y el Colegio Colombiano de Psicólogos (COLPSIC). Es normal que después de un sismo aparezcan miedo, nerviosismo, dificultad para concentrarse o alteraciones del sueño.',
    NULL,
    NULL,
    ARRAY['123 opción 3'],
    '24 horas, todos los días',
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/estamos-contigo-puedes-usar-la-linea-de-salud-mental-123-opcion-3/',
    'verificado',
    true
  ),
  (
    'cuerpo-oficial-de-bomberos-de-manizales',
    'lineas_atencion',
    'Cuerpo Oficial de Bomberos',
    'Incendios, rescate, atención de daños y solicitud de revisión de una vivienda con afectaciones. Es la línea que indica la Alcaldía para pedir que personal competente revise un inmueble con grietas, desprendimientos o dudas de seguridad. También se atiende por la opción 4 del menú de la línea 123. No intente determinar por fotografías ni por el tamaño de una grieta si el inmueble es seguro.',
    NULL,
    NULL,
    ARRAY['119', '123 opción 4'],
    '24 horas, todos los días del año',
    'Bomberos de Manizales — https://centrodeinformacion.manizales.gov.co/el-buen-uso-de-la-linea-119-del-cuerpo-oficial-de-bomberos-permite-mayor-eficacia-en-atencion-de-emergencias/',
    'verificado',
    true
  ),
  (
    'unidad-de-proteccion-animal',
    'lineas_atencion',
    'Unidad de Protección Animal',
    'Emergencias con animales: animal herido, atrapado o en riesgo. Se atiende por la opción 5 del menú de la línea 123. No ingrese a una estructura insegura únicamente para recuperar un animal.',
    NULL,
    NULL,
    ARRAY['123 opción 5'],
    '24 horas, todos los días',
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/jornada-de-adopcion-de-la-upa-nuevos-hogares-para-perros-y-gatos/',
    'verificado',
    true
  ),
  (
    'linea-especial-personas-desaparecidas-y-danos-estructurales',
    'lineas_atencion',
    'Línea especial de la emergencia: personas desaparecidas y daños estructurales',
    'Línea habilitada durante esta emergencia para reportar personas desaparecidas y daños estructurales que no hayan sido reportados. El número celular atiende el mismo propósito. La fuente es una publicación oficial de la Alcaldía aportada al proyecto y verificada visualmente; no se dispone todavía del enlace directo a la publicación.',
    NULL,
    NULL,
    ARRAY['132', '320 263 8306'],
    'Durante la emergencia actual',
    'Publicación oficial de la Alcaldía de Manizales aportada al proyecto',
    'verificado',
    true
  ),
  (
    'cruz-roja-colombiana-manizales',
    'lineas_atencion',
    'Cruz Roja Colombiana',
    'El directorio municipal de emergencias registra la línea 132 para Cruz Roja, emergencias y ambulancias. El mismo número aparece en una publicación oficial de esta emergencia como línea de reporte de personas desaparecidas; el directorio no aclara cómo se reparte la atención entre los dos usos.',
    NULL,
    NULL,
    ARRAY['132'],
    NULL,
    'Directorio municipal de emergencias 2026, Alcaldía de Manizales',
    'verificado',
    true
  ),
  (
    'defensa-civil-colombiana-manizales',
    'lineas_atencion',
    'Defensa Civil Colombiana',
    'Emergencias y apoyo de organismos de socorro.',
    NULL,
    NULL,
    ARRAY['144'],
    NULL,
    'Directorio municipal de emergencias 2026, Alcaldía de Manizales',
    'verificado',
    true
  ),
  (
    'linea-amiga-de-atencion-al-menor',
    'lineas_atencion',
    'Línea Amiga de Atención al Menor',
    'Orientación y atención a niñas, niños y adolescentes.',
    NULL,
    NULL,
    ARRAY['106'],
    NULL,
    'Directorio municipal de emergencias 2026, Alcaldía de Manizales',
    'verificado',
    true
  ),
  (
    'patrulla-purpura',
    'lineas_atencion',
    'Patrulla Púrpura',
    'Atención especializada en violencia contra las mujeres. El número atiende por WhatsApp y trabaja articulado con la opción 3 de la línea 123.',
    NULL,
    NULL,
    ARRAY['321 821 8741'],
    '24 horas, todos los días',
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/estamos-contigo-puedes-usar-la-linea-de-salud-mental-123-opcion-3/',
    'verificado',
    true
  ),
  (
    'secretaria-de-movilidad-de-manizales',
    'lineas_atencion',
    'Secretaría de Movilidad de Manizales',
    'Atención de tránsito y movilidad. El segundo número atiende por WhatsApp.',
    NULL,
    NULL,
    ARRAY['606 891 8494', '333 602 5521'],
    NULL,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/consulta-y-gestiona-tus-comparendos-por-fotodeteccion-de-manera-virtual/',
    'verificado',
    true
  ),
  (
    'policia-de-carreteras',
    'lineas_atencion',
    'Policía de Carreteras',
    'Emergencias o información en carretera. El número se marca completo, con el signo numeral incluido.',
    NULL,
    NULL,
    ARRAY['#767'],
    NULL,
    'Directorio municipal de emergencias 2026, Alcaldía de Manizales',
    'verificado',
    true
  ),

  -- ===========================================================================
  -- §4 Albergues -> albergues
  --
  -- RI-1. The official balance counts three enabled shelters and names one.
  -- The two unnamed ones are absent from this file on purpose: a shelter row
  -- with a plausible address is an invented refuge, and someone would walk to
  -- it at night.
  -- ===========================================================================

  (
    'coliseo-mayor-jorge-arango-uribe',
    'albergues',
    'Coliseo Mayor Jorge Arango Uribe',
    'Albergue temporal habilitado para personas que por seguridad no pueden permanecer en sus viviendas mientras avanzan las revisiones de infraestructura. Servicios anunciados: colchonetas, frazadas, alimentación, hidratación, duchas, servicios sanitarios y elementos de aseo y manutención. La capacidad informada inicialmente fue de aproximadamente 70 personas y al momento del comunicado inicial había recibido 15 personas; sobre la capacidad disponible en este momento no se encontró información oficial confirmada hasta la última verificación. La Alcaldía solicitó no llevar más alimentos a los albergues hasta nuevo aviso oficial, porque informó que había alimentos suficientes para la población albergada.',
    NULL,
    'Referencia informada por la Alcaldía: Unidad Deportiva Palogrande. La dirección exacta está pendiente de validación en una fuente geográfica oficial.',
    ARRAY[]::text[],
    NULL,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/vicepresidente-jose-manuel-restrepo-conoce-balance-de-afectaciones-por-sismo-en-manizales/',
    'verificado',
    true
  ),
  (
    -- Announced only as a possibility, never confirmed as open. It is recorded
    -- so the team does not have to rediscover it, and left unpublished so RI-1
    -- holds: an unconfirmed shelter must not reach a public list at all, not
    -- even carrying a warning label.
    'coliseo-menor-ramon-marin-vargas',
    'albergues',
    'Coliseo Menor Ramón Marín Vargas',
    'Un comunicado oficial inicial indicó que este espacio podría abrirse como segundo alojamiento temporal si la evolución de la emergencia lo requería. No existe una confirmación oficial posterior de que esté abierto ni recibiendo personas, y por eso no se publica. No debe marcarse como abierto sin una confirmación específica.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Alcaldía de Manizales — comunicado inicial aportado al proyecto',
    'pendiente',
    false
  ),

  -- ===========================================================================
  -- §5 Donación de sangre -> donacion_sangre
  -- ===========================================================================

  (
    'hemocentro-del-cafe',
    'donacion_sangre',
    'Hemocentro del Café',
    'Punto de recepción de donaciones de sangre durante la emergencia. Se reciben donantes de todos los grupos sanguíneos; las reservas O positivo y O negativo fueron señaladas como especialmente importantes, aunque todos los grupos son necesarios. Sobre si la atención continúa durante la noche o si el horario cambió, no se encontró información oficial confirmada hasta la última verificación.',
    'Avenida Kevin Ángel, Carrera 21 #70A-06, primer piso',
    NULL,
    ARRAY[]::text[],
    'Recepción anunciada desde las 12:30 p. m. del 10 de agosto de 2026',
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/comunicado-de-prensa-sobre-donacion-de-sangre/',
    'verificado',
    true
  ),
  (
    'canchas-auxiliares-bomberos-palogrande',
    'donacion_sangre',
    'Canchas auxiliares junto a la Estación de Bomberos Palogrande',
    'Punto temporal de recepción de donaciones de sangre anunciado para esta emergencia. Se reciben donantes de todos los grupos sanguíneos; las reservas O positivo y O negativo fueron señaladas como especialmente importantes. Sobre el horario de atención de este punto no se encontró información oficial confirmada hasta la última verificación.',
    'Sector Palogrande, junto a la Estación de Bomberos',
    NULL,
    ARRAY[]::text[],
    NULL,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/comunicado-de-prensa-sobre-donacion-de-sangre/',
    'verificado',
    true
  ),

  -- ===========================================================================
  -- §6 Hospitales y red médica -> hospitales
  --
  -- RI-2. Every institution here is seeded as 'pendiente', which reads
  -- "announced, official detail missing" — not as 'cerrado'. §16 of the source
  -- lists the service-by-service operating state of the medical network as
  -- unverified, and closing a hospital in this directory on our own authority
  -- would redirect an ambulance.
  -- ===========================================================================

  (
    'hospital-departamental-santa-sofia',
    'hospitales',
    'Hospital Departamental Santa Sofía',
    'Hospital de alta complejidad y prestador de transporte asistencial dentro del Sistema de Emergencias Médicas. El balance oficial más reciente informa que presenta afectaciones y requiere intervención, y que se solicitó apoyo de profesionales y recursos al Ministerio de Salud. No existe confirmación oficial revisada de cierre total: presentar afectaciones no significa estar cerrado. Para una urgencia médica marque 123 y elija la opción 2, que coordina el traslado al prestador adecuado.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/vicepresidente-jose-manuel-restrepo-conoce-balance-de-afectaciones-por-sismo-en-manizales/',
    'pendiente',
    true
  ),
  (
    'ses-hospital-de-caldas',
    'hospitales',
    'S.E.S. Hospital de Caldas',
    'Integrante de la red hospitalaria de alta complejidad de Manizales. Sobre su estado operativo específico después del sismo no se encontró información oficial confirmada hasta la última verificación. Para una urgencia médica marque 123 y elija la opción 2.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Secretaría de Salud de Manizales — https://salud.manizales.gov.co/sistema-de-emergencias-medicas/',
    'pendiente',
    true
  ),
  (
    'clinica-avidanti-manizales',
    'hospitales',
    'Clínica Avidanti Manizales',
    'Institución de alta complejidad con urgencias, trauma, ortopedia y unidad de cuidados intensivos. Sobre su estado operativo específico después del sismo no se encontró información oficial confirmada hasta la última verificación. Para una urgencia médica marque 123 y elija la opción 2.',
    NULL,
    NULL,
    ARRAY[]::text[],
    'Urgencias anunciadas 24 horas antes del sismo; continuidad después del sismo sin confirmar',
    'Clínica Avidanti — https://www.avidanti.com/index.php/clinica-avidanti-manizales/',
    'pendiente',
    true
  ),
  (
    'clinica-ospedale-manizales',
    'hospitales',
    'Clínica Ospedale Manizales',
    'Institución con servicios de hospitalización y cirugía, vigente en el directorio publicado. Sobre su estado operativo específico después del sismo no se encontró información oficial confirmada hasta la última verificación. Para una urgencia médica marque 123 y elija la opción 2.',
    'Calle 51 #25-50',
    NULL,
    ARRAY['606 248 0022'],
    NULL,
    'Clínica Ospedale Manizales — https://clinicaospedalemanizales.com/',
    'pendiente',
    true
  ),
  (
    'clinica-san-marcel',
    'hospitales',
    'Clínica San Marcel',
    'Integrante de la red de urgencias referenciada por la Secretaría de Salud. Sobre su dirección, sus teléfonos y su estado operativo específico después del sismo no se encontró información oficial confirmada hasta la última verificación. Para una urgencia médica marque 123 y elija la opción 2.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Secretaría de Salud de Manizales — https://salud.manizales.gov.co/sistema-de-emergencias-medicas/',
    'pendiente',
    true
  ),
  (
    'hospital-general-san-isidro',
    'hospitales',
    'Hospital General San Isidro',
    'Prestador de transporte asistencial dentro del Sistema de Emergencias Médicas. Sobre su estado operativo específico después del sismo no se encontró información oficial confirmada hasta la última verificación. Para una urgencia médica marque 123 y elija la opción 2.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Secretaría de Salud de Manizales — https://salud.manizales.gov.co/sistema-de-emergencias-medicas/',
    'pendiente',
    true
  ),
  (
    'assbasalud-ese',
    'hospitales',
    'Assbasalud ESE',
    'Red pública municipal y prestador del Sistema de Emergencias Médicas, con varias sedes. Sobre el estado operativo de cada sede después del sismo no se encontró información oficial confirmada hasta la última verificación. Para una urgencia médica marque 123 y elija la opción 2.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Secretaría de Salud de Manizales — https://salud.manizales.gov.co/sistema-de-emergencias-medicas/',
    'pendiente',
    true
  ),

  -- ===========================================================================
  -- §9 Vías y movilidad -> cierres_viales
  --
  -- RI-4. These three rows are the entire section. The Kilómetro 41 affectation
  -- has no confirmed closure detail and the urban road network has no
  -- consolidated official list, so neither is seeded: a road published as
  -- closed on the strength of a video sends people the long way round.
  --
  -- They are 'cerrado' and they stay published (RF-5.8). Someone who reaches an
  -- out-of-service station needs to read that it is out of service, not
  -- conclude the system never existed.
  -- ===========================================================================

  (
    'cable-aereo-linea-1',
    'cierres_viales',
    'Cable Aéreo de Manizales — Línea 1',
    'Fuera de servicio mientras se realizan inspecciones técnicas tras el sismo. No hay fecha oficial de reanudación. Prevea un medio de transporte alternativo.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/cable-aereo-manizales-adelanta-evaluacion-tecnica-tras-afectacion-en-el-sistema/',
    'cerrado',
    true
  ),
  (
    'cable-aereo-linea-2',
    'cierres_viales',
    'Cable Aéreo de Manizales — Línea 2',
    'Fuera de servicio mientras se realizan inspecciones técnicas tras el sismo. No hay fecha oficial de reanudación. Prevea un medio de transporte alternativo.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/cable-aereo-manizales-adelanta-evaluacion-tecnica-tras-afectacion-en-el-sistema/',
    'cerrado',
    true
  ),
  (
    'cable-aereo-linea-3',
    'cierres_viales',
    'Cable Aéreo de Manizales — Línea 3',
    'Fuera de servicio mientras se realizan inspecciones técnicas tras el sismo. Esta línea presentó impactos mecánicos y electrónicos, y daños físicos en la estación Cable. Los usuarios fueron evacuados y el comunicado oficial no reportó personas lesionadas. No hay fecha oficial de reanudación.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Alcaldía de Manizales — https://centrodeinformacion.manizales.gov.co/cable-aereo-manizales-adelanta-evaluacion-tecnica-tras-afectacion-en-el-sistema/',
    'cerrado',
    true
  ),

  -- ===========================================================================
  -- §10 Servicios públicos -> servicios_publicos
  --
  -- The utilities appear here and not under lineas_atencion so that one entity
  -- is one row. Their reporting numbers travel with them.
  -- ===========================================================================

  (
    'chec-energia-electrica',
    'servicios_publicos',
    'CHEC — Energía eléctrica',
    'Línea para reportar daños o interrupciones del servicio de energía. Está confirmada una afectación de infraestructura eléctrica en el sector Cerro Bravo. Sobre el balance completo de interrupciones en la ciudad no se encontró información oficial confirmada hasta la última verificación. Ante cables caídos mantenga distancia, no toque el cable ni objetos en contacto con él, evite charcos cercanos y reporte al 115; si hay riesgo inmediato para personas, llame al 123.',
    NULL,
    NULL,
    ARRAY['115'],
    NULL,
    'CHEC — https://www.chec.com.co/home/transparencia/tramites-y-servicios/mecanismos-de-atencion',
    'verificado',
    true
  ),
  (
    'aguas-de-manizales-acueducto-y-alcantarillado',
    'servicios_publicos',
    'Aguas de Manizales — Acueducto y alcantarillado',
    'Línea para reportar novedades de acueducto y alcantarillado. El segundo número atiende por WhatsApp. Sobre una afectación generalizada del servicio tras el sismo no se encontró información oficial confirmada hasta la última verificación. Ante una fuga de agua evite las zonas inundadas si hay riesgo eléctrico o estructural y reporte al 116.',
    NULL,
    NULL,
    ARRAY['116', '310 793 2324'],
    NULL,
    'Aguas de Manizales — https://www.aguasdemanizales.com.co/',
    'verificado',
    true
  ),
  (
    'efigas-gas-natural',
    'servicios_publicos',
    'Efigas — Gas natural',
    'Línea de emergencias de gas natural, disponible 24 horas; el segundo número es el de servicio al cliente. Sobre una afectación generalizada del servicio tras el sismo no se encontró información oficial confirmada hasta la última verificación. Si huele a gas no encienda fósforos, velas ni llamas, no accione interruptores, abra puertas y ventanas y cierre válvulas si es seguro hacerlo; si el olor es fuerte o persiste, evacúe y llame al 164, y al 119 o 123 si hay peligro inmediato.',
    NULL,
    NULL,
    ARRAY['164', '606 898 3222'],
    'Emergencias 24 horas. Servicio al cliente de lunes a sábado, 7 a. m. a 7 p. m.',
    'Efigas — https://www.efigas.com.co/atencion-al-cliente-efigas/',
    'verificado',
    true
  ),
  (
    'telecomunicaciones-manizales',
    'servicios_publicos',
    'Telecomunicaciones',
    'Sobre el estado de las telecomunicaciones en la ciudad no se encontró información oficial confirmada hasta la última verificación. Las fallas de servicio se reportan directamente al operador; si la falla implica un riesgo para personas, llame al 123.',
    NULL,
    NULL,
    ARRAY[]::text[],
    NULL,
    'Base verificada de emergencia, Alcaldía de Manizales y Servicio Geológico Colombiano',
    'pendiente',
    true
  )

) AS seed (
  slug, category, name, description, address, meeting_point,
  phones, hours, source, status, is_published
)
-- DO NOTHING, not DO UPDATE. Re-running the seed must not silently revert a
-- correction a moderator made afterwards through RF-6; the directory is
-- editable, and a later fact beats an older document.
ON CONFLICT (slug) DO NOTHING;
