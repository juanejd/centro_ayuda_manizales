-- =============================================================================
-- Centro de Ayuda Manizales — Data model
--
-- Companion to docs/TRD.md section 9. This is the authoritative definition of
-- types, constraints, indexes and policies.
--
-- Target: PostgreSQL 15+ (Supabase). Requires pgcrypto and pg_trgm.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- partial-word search on directory names


-- =============================================================================
-- 1. Shared helpers and reference data
-- =============================================================================

-- updated_at is a lie unless something maintains it. A trigger is the only way
-- to keep it honest across every write path (Server Action, moderation, SQL).
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- 1b. Reference data
-- =============================================================================

-- Geography for a single-municipality MVP: Manizales.
--
-- Three columns work together on every located row, and the split exists to
-- solve one problem: the reliable filter and the honest record of what the
-- person actually said are not the same thing.
--
--   sector            what the person typed, verbatim. ALWAYS present.
--   neighborhood_code set only when that text matched the catalogue.
--   comuna_code       set on match, or assigned later by a moderator.
--
-- Someone in an informal settlement, a vereda or a brand-new development will
-- type a name that is in no catalogue. Rejecting them is not an option, so the
-- text is kept and the zone stays NULL until a human resolves it. That is why
-- comuna_code is NULLABLE and why the public view LEFT JOINs it: an inner join
-- would silently hide exactly the people least likely to be on a map.
--
-- Free text alone would reintroduce a silent bug one level down: "La Enea",
-- "la enea" and "Enea" would be three different filter buckets and matching
-- would return nothing with no error. The catalogue is what prevents that.

CREATE TABLE comunas (
  comuna_code           TEXT        PRIMARY KEY
                                    CHECK (comuna_code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                                           AND length(comuna_code) <= 60),
  name                  TEXT        NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  -- Manizales has urban comunas and rural corregimientos. Both are valid zones
  -- and the distinction matters for logistics: reaching a corregimiento is a
  -- different journey from crossing a comuna.
  kind                  TEXT        NOT NULL CHECK (kind IN ('urbana', 'rural')),
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  sort_order            INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX comunas_active_idx ON comunas (sort_order, name) WHERE is_active;

CREATE TABLE neighborhoods (
  neighborhood_code     TEXT        PRIMARY KEY
                                    CHECK (neighborhood_code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                                           AND length(neighborhood_code) <= 80),
  name                  TEXT        NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  comuna_code           TEXT        NOT NULL REFERENCES comunas(comuna_code),
  is_active             BOOLEAN     NOT NULL DEFAULT true,

  -- Redundant on its own, but it is what lets a located row carry a composite
  -- foreign key and stay consistent without a trigger. See the tables below.
  UNIQUE (neighborhood_code, comuna_code)
);

-- FK index: not automatic.
CREATE INDEX neighborhoods_comuna_idx ON neighborhoods (comuna_code);

-- Autocomplete. Full-text search stems whole words, so "La Ene" would match
-- nothing; a trigram index makes prefix and substring typing work, which is the
-- entire point of the field.
CREATE INDEX neighborhoods_name_trgm_idx
  ON neighborhoods USING GIN (name gin_trgm_ops);


-- =============================================================================
-- 2. help_requests — TRD RF-1, RF-2, RF-4
-- =============================================================================
--
-- The surrogate key is BIGINT IDENTITY. Opacity is required, but for two
-- *different* values, so they are separate columns rather than an opaque PK:
--   - reference_code : short, human-readable, dictated over the phone
--   - manage_token   : unguessable, authorizes RF-4 without an account
-- request_id is never exposed publicly (see the view in section 3 below), so a
-- sequential key leaks nothing and gives better index locality than a random
-- UUID.

CREATE TABLE help_requests (
  request_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Public-facing identifier. 8 chars, Crockford base32 minus I/L/O/U to avoid
  -- both visual ambiguity and accidental words. Generated in the application;
  -- this UNIQUE constraint is what makes the retry-on-conflict loop correct.
  reference_code        TEXT        NOT NULL UNIQUE
                                    CHECK (reference_code ~ '^[0-9A-HJKMNPQRSTVWXYZ]{8}$'),

  -- RF-4.4. Never selected into any public view.
  manage_token          UUID        NOT NULL DEFAULT gen_random_uuid(),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RF-1.4. TEXT + CHECK rather than a native ENUM: emergency categories are
  -- business-driven and will change between events. A CHECK is alterable in one
  -- statement; an ENUM value can never be removed.
  category              TEXT        NOT NULL CHECK (category IN (
                                      'salud', 'vivienda', 'albergue', 'alimentos',
                                      'agua', 'sangre', 'mascotas', 'movilidad',
                                      'servicios_publicos', 'personas_desaparecidas',
                                      'atencion_psicologica', 'transporte',
                                      'remocion_escombros', 'otros')),

  -- Length caps via CHECK, not VARCHAR(n). They double as a cheap
  -- denial-of-service guard on an unauthenticated write path.
  description           TEXT        NOT NULL CHECK (length(description) BETWEEN 10 AND 2000),

  -- Geography. What the person typed is mandatory; the resolved zone is not.
  sector                TEXT        NOT NULL CHECK (length(sector) BETWEEN 2 AND 160),
  neighborhood_code     TEXT,
  comuna_code           TEXT        REFERENCES comunas(comuna_code),
  address               TEXT        CHECK (length(address) <= 240),

  -- NUMERIC, not DOUBLE PRECISION: RNF-5.6 requires publishing round(coord, 3),
  -- and in PostgreSQL round(v, s) with a scale argument exists only for NUMERIC
  -- — round(double precision) takes no scale — so DOUBLE would force a cast
  -- inside the security-critical view. NUMERIC(9,6) also stores the value
  -- exactly, which keeps the rounding boundary stable.
  -- PostGIS is not warranted: this system filters by comuna, never by radius or
  -- distance.
  latitude              NUMERIC(9,6) CHECK (latitude  BETWEEN  -90 AND  90),
  longitude             NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),

  -- CHECK passes on NULL (three-valued logic), which is what we want: the field
  -- is optional, but when present it must be sane.
  affected_people       INTEGER     CHECK (affected_people BETWEEN 0 AND 100000),

  -- RF-1.2: both are mandatory and both are PUBLIC. See TRD section 8.
  contact_name          TEXT        NOT NULL CHECK (length(contact_name) BETWEEN 2 AND 160),

  -- Permissive on purpose. A strict phone pattern that rejects a valid number
  -- during an emergency is worse than storing a malformed one, so this only
  -- guards length and character class. No DOMAIN type here for the same reason.
  contact_phone         TEXT        NOT NULL CHECK (contact_phone ~ '^[0-9+()#* -]{7,25}$'),

  -- Storage path, not a URL. The photo is PUBLIC (RF-1.8), so two things are
  -- load-bearing: the path is UUID-based to keep the bucket non-enumerable
  -- (RNF-5.8), and every metadata block is stripped server-side before the file
  -- is written (RNF-5.7). Without the strip, a phone's EXIF GPS would publish
  -- the exact dwelling and defeat the coordinate rounding in the view below.
  -- Nullable also means "no photo" and "photo retired by a moderator" (RF-6.4).
  photo_path            TEXT        CHECK (length(photo_path) <= 512),

  -- RNF-6.2: timestamps, not booleans. A boolean cannot prove *when* consent
  -- was given, which is exactly what has to be provable under Ley 1581.
  consent_accepted_at   TIMESTAMPTZ NOT NULL,
  public_consent_at     TIMESTAMPTZ NOT NULL,

  -- Two orthogonal axes, deliberately not collapsed into one enum: a request
  -- can be verified AND fulfilled at the same time.
  moderation_status     TEXT        NOT NULL DEFAULT 'sin_verificar'
                                    CHECK (moderation_status IN (
                                      'sin_verificar', 'verificado', 'duplicado',
                                      'oculta', 'retirada')),
  fulfillment_status    TEXT        NOT NULL DEFAULT 'abierta'
                                    CHECK (fulfillment_status IN ('abierta', 'atendida')),

  -- RF-1.12: never set automatically. NULL means "no human has triaged this".
  priority              TEXT        CHECK (priority IN ('critico', 'alto', 'medio', 'bajo')),

  duplicate_of          BIGINT      REFERENCES help_requests(request_id) ON DELETE SET NULL,
  verified_source       TEXT        CHECK (length(verified_source) <= 160),
  verified_by           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at           TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  withdrawn_at          TIMESTAMPTZ,

  -- RNF-5.9: bounds the exposure window in time.
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),

  -- Full-text search over the description. Two things are load-bearing here:
  --   1. Always pass the language. to_tsvector('spanish', ...) is IMMUTABLE,
  --      which is what makes a STORED generated column legal at all; the
  --      single-argument form is only STABLE and would be rejected.
  --   2. 'spanish' — not 'english' — so that stemming and stop words match the
  --      language people actually type in.
  search_vector         TSVECTOR GENERATED ALWAYS AS (
                          to_tsvector('spanish', coalesce(description, ''))
                        ) STORED,

  -- Geography consistency without a trigger. A composite foreign key uses MATCH
  -- SIMPLE by default, so it is NOT checked when any of its columns is NULL:
  --   ('la-enea', 'tesorito')  valid pair              -> accepted
  --   ('la-enea', 'san-jose')  barrio in another comuna -> rejected
  --   (NULL,      'tesorito')  zone assigned by a moderator, no barrio -> accepted
  --   (NULL,      NULL)        unresolved, pending moderation          -> accepted
  -- The CHECK closes the only remaining nonsense: a barrio without its comuna.
  FOREIGN KEY (neighborhood_code, comuna_code)
    REFERENCES neighborhoods (neighborhood_code, comuna_code),
  CONSTRAINT help_requests_geo_consistent CHECK (
    neighborhood_code IS NULL OR comuna_code IS NOT NULL
  ),

  -- A request cannot be its own duplicate.
  CONSTRAINT help_requests_duplicate_not_self CHECK (duplicate_of IS DISTINCT FROM request_id),

  -- If it is marked verified, say who and when. Half-recorded provenance is
  -- worse than none: RF-2.5 renders the source on the public badge.
  CONSTRAINT help_requests_verified_complete CHECK (
    moderation_status <> 'verificado'
    OR (verified_at IS NOT NULL AND verified_source IS NOT NULL)
  ),

  -- RF-2.6 measures the 48h window from resolved_at, so it must exist.
  CONSTRAINT help_requests_resolved_has_timestamp CHECK (
    fulfillment_status <> 'atendida' OR resolved_at IS NOT NULL
  ),

  -- RF-4.3 hides by timestamp, so the status and the timestamp must agree.
  CONSTRAINT help_requests_withdrawn_consistent CHECK (
    (moderation_status = 'retirada') = (withdrawn_at IS NOT NULL)
  )
);

CREATE TRIGGER help_requests_touch
  BEFORE UPDATE ON help_requests
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Indexes. Index the access paths we actually query,
-- and nothing else. Every extra index taxes an insert-heavy public form.

-- RF-2.1 board ordering.
CREATE INDEX help_requests_created_at_idx
  ON help_requests (created_at DESC);

-- RF-2.2 board filters. Partial, because the board only ever reads visible
-- rows. The predicate uses only IMMUTABLE expressions — expires_at > now()
-- deliberately stays OUT of it, since now() is not immutable and would make
-- the index illegal.
CREATE INDEX help_requests_board_idx
  ON help_requests (comuna_code, category, created_at DESC)
  WHERE withdrawn_at IS NULL
    AND moderation_status NOT IN ('oculta', 'retirada');

-- RF-2.2 text search.
CREATE INDEX help_requests_search_idx
  ON help_requests USING GIN (search_vector);

-- FK indexes. PostgreSQL does NOT create these automatically.
CREATE INDEX help_requests_duplicate_of_idx ON help_requests (duplicate_of);
CREATE INDEX help_requests_verified_by_idx  ON help_requests (verified_by);

-- Separate plain indexes for the geography FKs. The board index above cannot
-- serve them: a partial index is invisible to a referential integrity check,
-- which must be able to find ANY referencing row, including the hidden ones.
CREATE INDEX help_requests_comuna_idx       ON help_requests (comuna_code);
CREATE INDEX help_requests_neighborhood_idx ON help_requests (neighborhood_code, comuna_code);

-- RF-6.2 moderation list: pending items first.
CREATE INDEX help_requests_moderation_idx
  ON help_requests (moderation_status, priority, created_at DESC);

-- Expiry sweep (RNF-5.9).
CREATE INDEX help_requests_expires_at_idx
  ON help_requests (expires_at)
  WHERE moderation_status NOT IN ('oculta', 'retirada');


-- =============================================================================
-- 3. public_help_requests — the ONLY surface the anon role may read
-- =============================================================================
--
-- SECURITY-CRITICAL, and the subtlest point in this file.
--
-- security_invoker = false (the PG15+ default, pinned here explicitly) means
-- the view executes with its OWNER's privileges, so it can read help_requests
-- even though the anon role has no privilege on that table at all. That
-- bypass is the intended design, not an accident: it is what lets anon read a
-- narrow, filtered projection while remaining unable to touch manage_token,
-- priority or exact coordinates. Setting security_invoker = true — which some
-- Supabase templates do by default — would break RF-2 entirely.
--
-- security_barrier = true stops the planner from pushing a user-supplied
-- function below the view's WHERE clause, which could otherwise leak rows the
-- filter was meant to exclude.

CREATE VIEW public_help_requests
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  r.reference_code,
  r.created_at,
  r.category,
  r.description,
  r.sector,
  n.name  AS neighborhood,
  c.name  AS comuna,
  r.comuna_code,
  r.address,
  r.affected_people,
  r.contact_name,                        -- public by product decision
  r.contact_phone,                       -- public by product decision
  r.photo_path,                          -- public; metadata stripped on upload
  r.moderation_status,
  r.fulfillment_status,
  r.verified_source,
  r.verified_at,
  r.resolved_at,
  -- RNF-5.6: ~110 m. Enough to reach the block, not enough to pin a dwelling.
  round(r.latitude,  3) AS latitude_approx,
  round(r.longitude, 3) AS longitude_approx
FROM help_requests r
-- LEFT, not INNER. An unresolved zone must not remove the row from the board:
-- that would hide precisely the people whose neighbourhood is on no map.
LEFT JOIN neighborhoods n ON n.neighborhood_code = r.neighborhood_code
LEFT JOIN comunas       c ON c.comuna_code       = r.comuna_code
WHERE r.withdrawn_at IS NULL
  AND r.moderation_status IN ('sin_verificar', 'verificado', 'duplicado')
  AND r.expires_at > now()
  -- RF-2.6: fulfilled requests stay visible for 48 h, then drop off.
  AND (r.fulfillment_status = 'abierta' OR r.resolved_at > now() - INTERVAL '48 hours');

-- Never expose request_id, manage_token, priority, exact coordinates,
-- verified_by, duplicate_of, expires_at, or either consent timestamp.


-- =============================================================================
-- 4. help_offers — TRD RF-3
-- =============================================================================

CREATE TABLE help_offers (
  offer_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reference_code        TEXT        NOT NULL UNIQUE
                                    CHECK (reference_code ~ '^[0-9A-HJKMNPQRSTVWXYZ]{8}$'),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  contributor_type      TEXT        NOT NULL CHECK (contributor_type IN (
                                      'persona', 'empresa', 'organizacion')),
  contributor_name      TEXT        NOT NULL CHECK (length(contributor_name) BETWEEN 2 AND 200),

  -- RF-3.2. Kept in lockstep with the matching table in
  -- src/modules/matching/domain — TRD section 6.
  contribution_type     TEXT        NOT NULL CHECK (contribution_type IN (
                                      'dinero', 'alimentos', 'agua', 'ropa',
                                      'medicamentos', 'transporte', 'vehiculos',
                                      'maquinaria', 'herramientas', 'alojamiento',
                                      'alimento_mascotas', 'servicios_profesionales',
                                      'tiempo_voluntario', 'otro')),

  description           TEXT        CHECK (length(description) <= 2000),

  -- Free text on purpose: "50 mercados", "camión de 5 t". Forcing a structured
  -- quantity plus unit into a 90-second form produces abandonment or fiction.
  capacity              TEXT        CHECK (length(capacity) <= 240),

  sector                TEXT        CHECK (length(sector) <= 160),
  neighborhood_code     TEXT,
  comuna_code           TEXT        REFERENCES comunas(comuna_code),
  latitude              NUMERIC(9,6) CHECK (latitude  BETWEEN  -90 AND  90),
  longitude             NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
  availability          TEXT        CHECK (length(availability) <= 240),

  -- RF-3.11: never published. The asymmetry with help_requests is deliberate —
  -- the person asking for help explicitly authorized publication, the person
  -- offering it did not.
  contact_phone         TEXT        NOT NULL CHECK (contact_phone ~ '^[0-9+()#* -]{7,25}$'),
  contact_email         TEXT        CHECK (contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  consent_accepted_at   TIMESTAMPTZ NOT NULL,

  status                TEXT        NOT NULL DEFAULT 'nuevo' CHECK (status IN (
                                      'nuevo', 'contactado', 'en_uso', 'cerrado', 'descartado')),

  -- Geography consistency without a trigger. A composite foreign key uses MATCH
  -- SIMPLE by default, so it is NOT checked when any of its columns is NULL:
  --   ('la-enea', 'tesorito')  valid pair              -> accepted
  --   ('la-enea', 'san-jose')  barrio in another comuna -> rejected
  --   (NULL,      'tesorito')  zone assigned by a moderator, no barrio -> accepted
  --   (NULL,      NULL)        unresolved, pending moderation          -> accepted
  -- The CHECK closes the only remaining nonsense: a barrio without its comuna.
  FOREIGN KEY (neighborhood_code, comuna_code)
    REFERENCES neighborhoods (neighborhood_code, comuna_code),
  CONSTRAINT help_offers_geo_consistent CHECK (
    neighborhood_code IS NULL OR comuna_code IS NOT NULL
  )
);

CREATE TRIGGER help_offers_touch
  BEFORE UPDATE ON help_offers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX help_offers_created_at_idx ON help_offers (created_at DESC);
CREATE INDEX help_offers_lookup_idx     ON help_offers (contribution_type, comuna_code);
CREATE INDEX help_offers_status_idx     ON help_offers (status, created_at DESC);

-- FK indexes: comuna_code is not the leftmost column above.
CREATE INDEX help_offers_comuna_idx       ON help_offers (comuna_code);
CREATE INDEX help_offers_neighborhood_idx ON help_offers (neighborhood_code, comuna_code);

-- No public view: RF-3.11 gives the anon role no read path here at all.


-- =============================================================================
-- 5. info_resources — TRD RF-5
-- =============================================================================

CREATE TABLE info_resources (
  resource_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug                  TEXT        NOT NULL UNIQUE
                                    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 140),

  category              TEXT        NOT NULL CHECK (category IN (
                                      'albergues', 'hospitales', 'centros_medicos',
                                      'donacion_sangre', 'puntos_donacion', 'centros_acopio',
                                      'atencion_mascotas', 'personas_desaparecidas',
                                      'evaluacion_viviendas', 'servicios_publicos',
                                      'bomberos', 'defensa_civil', 'cruz_roja',
                                      'alcaldias', 'gobernacion', 'lineas_atencion',
                                      'cierres_viales', 'otros')),

  name                  TEXT        NOT NULL CHECK (length(name) BETWEEN 2 AND 200),
  description           TEXT        CHECK (length(description) <= 4000),
  address               TEXT        CHECK (length(address) <= 240),
  neighborhood_code     TEXT,
  comuna_code           TEXT        REFERENCES comunas(comuna_code),

  -- RF-5.3. Addition to the source document.
  meeting_point         TEXT        CHECK (length(meeting_point) <= 400),

  latitude              NUMERIC(9,6) CHECK (latitude  BETWEEN  -90 AND  90),
  longitude             NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),

  -- An array, not a junction table: phone numbers are values with an order, not
  -- entities, and nothing joins on them. No GIN index: we never query BY phone,
  -- only display them.
  phones                TEXT[]      NOT NULL DEFAULT '{}'
                                    CHECK (cardinality(phones) <= 10),

  hours                 TEXT        CHECK (length(hours) <= 240),
  source                TEXT        CHECK (length(source) <= 200),

  status                TEXT        NOT NULL DEFAULT 'pendiente' CHECK (status IN (
                                      'verificado', 'pendiente', 'desactualizado', 'cerrado')),

  -- RF-5.6 renders staleness from this. If it claims verified, it must say when.
  verified_at           TIMESTAMPTZ,
  is_published          BOOLEAN     NOT NULL DEFAULT false,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Weighted search vector: a hit on the name outranks a hit on the body, which
  -- is what someone typing "hospital" expects. Both to_tsvector calls pass the
  -- language explicitly, so the whole expression stays IMMUTABLE.
  search_vector         TSVECTOR GENERATED ALWAYS AS (
                          setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
                          setweight(to_tsvector('spanish', coalesce(description, '')), 'B')
                        ) STORED,

  -- Geography consistency without a trigger. A composite foreign key uses MATCH
  -- SIMPLE by default, so it is NOT checked when any of its columns is NULL:
  --   ('la-enea', 'tesorito')  valid pair              -> accepted
  --   ('la-enea', 'san-jose')  barrio in another comuna -> rejected
  --   (NULL,      'tesorito')  zone assigned by a moderator, no barrio -> accepted
  --   (NULL,      NULL)        unresolved, pending moderation          -> accepted
  -- The CHECK closes the only remaining nonsense: a barrio without its comuna.
  FOREIGN KEY (neighborhood_code, comuna_code)
    REFERENCES neighborhoods (neighborhood_code, comuna_code),
  CONSTRAINT info_resources_geo_consistent CHECK (
    neighborhood_code IS NULL OR comuna_code IS NOT NULL
  ),

  CONSTRAINT info_resources_verified_has_timestamp CHECK (
    status <> 'verificado' OR verified_at IS NOT NULL
  )
);

CREATE TRIGGER info_resources_touch
  BEFORE UPDATE ON info_resources
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RF-5.1 filters, restricted to what the public actually reads.
CREATE INDEX info_resources_published_idx
  ON info_resources (category, comuna_code)
  WHERE is_published;

-- FK indexes: neither leftmost nor unconditional above.
CREATE INDEX info_resources_comuna_idx       ON info_resources (comuna_code);
CREATE INDEX info_resources_neighborhood_idx ON info_resources (neighborhood_code, comuna_code);

CREATE INDEX info_resources_search_idx
  ON info_resources USING GIN (search_vector);

-- Full-text search stems whole words, so "hospi" matches nothing. A trigram
-- index makes partial typing work, which matters on a phone keyboard in an
-- emergency.
CREATE INDEX info_resources_name_trgm_idx
  ON info_resources USING GIN (name gin_trgm_ops);

-- FK index (not automatic).
CREATE INDEX info_resources_updated_by_idx ON info_resources (updated_by);


-- =============================================================================
-- 6. info_resource_photos — TRD RF-5.7
-- =============================================================================
--
-- A separate table rather than TEXT[]: each photo carries its own caption and
-- order, and arrays are for values, not relations.

CREATE TABLE info_resource_photos (
  photo_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  resource_id           BIGINT      NOT NULL REFERENCES info_resources(resource_id)
                                    ON DELETE CASCADE,
  storage_path          TEXT        NOT NULL CHECK (length(storage_path) <= 512),

  -- Nullable in the database, mandatory in the editing UI (RNF-4.1). The
  -- database cannot tell a meaningful caption from " ", so enforcing it here
  -- would only invite a space character.
  caption               TEXT        CHECK (length(caption) <= 300),
  sort_order            INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (resource_id, sort_order)
);

-- FK index (not automatic) and the gallery's read path in one.
CREATE INDEX info_resource_photos_resource_idx
  ON info_resource_photos (resource_id, sort_order);


-- =============================================================================
-- 7. staff_members — TRD RF-6.1
-- =============================================================================
--
-- PK is UUID here, unlike every other table: it is not a surrogate key we chose
-- but a foreign key into Supabase's auth.users, whose type we do not control.

CREATE TABLE staff_members (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                  TEXT        NOT NULL CHECK (role IN ('moderator', 'admin')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A single authenticated role covers requests, offers and the directory.


-- =============================================================================
-- 8. moderation_log — TRD RF-6.6
-- =============================================================================

CREATE TABLE moderation_log (
  log_id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Polymorphic by design, so no FK is possible. The (type, id) index below is
  -- the only way to read an entity's history efficiently.
  entity_type           TEXT        NOT NULL CHECK (entity_type IN (
                                      'help_request', 'help_offer', 'info_resource')),
  entity_id             BIGINT      NOT NULL,

  action                TEXT        NOT NULL CHECK (action IN (
                                      'verify', 'hide', 'withdraw', 'mark_duplicate',
                                      'set_priority', 'resolve', 'update', 'publish',
                                      'unpublish')),

  -- Either a staff user_id, or the literal 'owner_token' when the citizen acted
  -- through RF-4. TEXT because those two identities have different shapes.
  actor                 TEXT        NOT NULL CHECK (length(actor) <= 100),

  -- Constrain the JSONB shape. Without this an array or a
  -- bare string would be accepted and every reader would need to defend itself.
  payload               JSONB       CHECK (payload IS NULL OR jsonb_typeof(payload) = 'object'),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX moderation_log_entity_idx  ON moderation_log (entity_type, entity_id, created_at DESC);
CREATE INDEX moderation_log_created_idx ON moderation_log (created_at DESC);

-- No GIN index on payload: it is written for audit and read by entity, never
-- queried by its contents. Adding one would only tax writes.


-- =============================================================================
-- 9. Row Level Security — TRD section 8.5
-- =============================================================================

ALTER TABLE comunas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_offers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_resources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_resource_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log       ENABLE ROW LEVEL SECURITY;

-- Membership test used by every staff policy. Authenticated is not enough.
--
-- Four things about this function are deliberate, and three of them are easy to
-- get wrong:
--
--   1. It lives in a PRIVATE schema, not in public. A SECURITY DEFINER function
--      bypasses RLS on whatever it touches, so it must not be callable directly
--      by anon or authenticated. What blocks the direct call is the ABSENCE of
--      USAGE on the schema, not a revoked EXECUTE — see the grant block below.
--   2. search_path is EMPTY and every reference is fully qualified. With a
--      mutable search_path, a caller could shadow staff_members with their own
--      table and grant themselves the role.
--   3. auth.uid() is wrapped in a SELECT so the planner evaluates it once as an
--      initplan instead of once per row.
--   4. STABLE, not VOLATILE, so the planner is allowed to cache it within a
--      statement.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = (SELECT auth.uid())
  );
$$;

-- The grants below are counter-intuitive and were verified empirically, so do
-- not "tidy" them.
--
-- An RLS policy expression is evaluated with the privileges of the role running
-- the query, NOT of the table owner. Revoking EXECUTE from `authenticated`
-- therefore does not harden the policy — it breaks it outright, with
-- "permission denied for function is_staff" on every read.
--
-- The isolation comes from the schema instead: `authenticated` never receives
-- USAGE on `private`, so a direct `select private.is_staff()` fails with
-- "permission denied for schema private", while the policy still evaluates.
REVOKE EXECUTE ON FUNCTION private.is_staff() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.is_staff() TO authenticated;
-- Deliberately absent: GRANT USAGE ON SCHEMA private TO anon, authenticated;

-- --- comunas and neighborhoods ----------------------------------------------
--
-- Public read: the forms drive their autocomplete from neighborhoods, and the
-- board and directory render their zone filter from comunas.

GRANT SELECT ON comunas, neighborhoods TO anon, authenticated;

CREATE POLICY comunas_public_read ON comunas
  FOR SELECT TO anon, authenticated USING (is_active);

CREATE POLICY neighborhoods_public_read ON neighborhoods
  FOR SELECT TO anon, authenticated USING (is_active);

GRANT INSERT, UPDATE ON comunas, neighborhoods TO authenticated;

CREATE POLICY comunas_staff_write ON comunas
  FOR ALL TO authenticated USING ((SELECT private.is_staff())) WITH CHECK ((SELECT private.is_staff()));

CREATE POLICY neighborhoods_staff_write ON neighborhoods
  FOR ALL TO authenticated USING ((SELECT private.is_staff())) WITH CHECK ((SELECT private.is_staff()));


-- --- help_requests -----------------------------------------------------------
--
-- Column-level privileges, not just policies. This is the part RLS alone does
-- NOT solve: a policy's WITH CHECK can reject a row, but only a column grant
-- stops the anon role from supplying priority or moderation_status in the first
-- place. Both layers are applied.

REVOKE ALL ON help_requests FROM anon, authenticated;

GRANT INSERT (reference_code, category, description, sector, neighborhood_code,
              comuna_code, address,
              latitude, longitude, affected_people, contact_name, contact_phone,
              photo_path, consent_accepted_at, public_consent_at)
  ON help_requests TO anon;

CREATE POLICY help_requests_anon_insert ON help_requests
  FOR INSERT TO anon
  WITH CHECK (
    moderation_status = 'sin_verificar'
    AND fulfillment_status = 'abierta'
    AND priority IS NULL
    AND withdrawn_at IS NULL
    AND verified_at IS NULL
    AND consent_accepted_at IS NOT NULL
    AND public_consent_at IS NOT NULL
  );

GRANT SELECT, UPDATE ON help_requests TO authenticated;

CREATE POLICY help_requests_staff_select ON help_requests
  FOR SELECT TO authenticated USING ((SELECT private.is_staff()));

CREATE POLICY help_requests_staff_update ON help_requests
  FOR UPDATE TO authenticated USING ((SELECT private.is_staff())) WITH CHECK ((SELECT private.is_staff()));

-- The public projection. anon reaches the data ONLY through here.
GRANT SELECT ON public_help_requests TO anon, authenticated;

-- --- help_offers -------------------------------------------------------------

REVOKE ALL ON help_offers FROM anon, authenticated;

GRANT INSERT (reference_code, contributor_type, contributor_name, contribution_type,
              description, capacity, sector, neighborhood_code, comuna_code,
              latitude, longitude,
              availability, contact_phone, contact_email, consent_accepted_at)
  ON help_offers TO anon;

CREATE POLICY help_offers_anon_insert ON help_offers
  FOR INSERT TO anon
  WITH CHECK (status = 'nuevo' AND consent_accepted_at IS NOT NULL);

GRANT SELECT, UPDATE ON help_offers TO authenticated;

CREATE POLICY help_offers_staff_select ON help_offers
  FOR SELECT TO authenticated USING ((SELECT private.is_staff()));

CREATE POLICY help_offers_staff_update ON help_offers
  FOR UPDATE TO authenticated USING ((SELECT private.is_staff())) WITH CHECK ((SELECT private.is_staff()));

-- --- info_resources ----------------------------------------------------------

GRANT SELECT ON info_resources TO anon, authenticated;

CREATE POLICY info_resources_public_read ON info_resources
  FOR SELECT TO anon, authenticated USING (is_published);

GRANT INSERT, UPDATE, DELETE ON info_resources TO authenticated;

CREATE POLICY info_resources_staff_all ON info_resources
  FOR ALL TO authenticated USING ((SELECT private.is_staff())) WITH CHECK ((SELECT private.is_staff()));

-- --- info_resource_photos ----------------------------------------------------

GRANT SELECT ON info_resource_photos TO anon, authenticated;

CREATE POLICY info_resource_photos_public_read ON info_resource_photos
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM info_resources r
    WHERE r.resource_id = info_resource_photos.resource_id AND r.is_published
  ));

GRANT INSERT, UPDATE, DELETE ON info_resource_photos TO authenticated;

CREATE POLICY info_resource_photos_staff_all ON info_resource_photos
  FOR ALL TO authenticated USING ((SELECT private.is_staff())) WITH CHECK ((SELECT private.is_staff()));

-- --- staff_members and moderation_log ---------------------------------------

REVOKE ALL ON staff_members  FROM anon, authenticated;
REVOKE ALL ON moderation_log FROM anon, authenticated;

GRANT SELECT ON staff_members TO authenticated;

CREATE POLICY staff_members_self_read ON staff_members
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_staff()));

GRANT SELECT, INSERT ON moderation_log TO authenticated;

CREATE POLICY moderation_log_staff_read ON moderation_log
  FOR SELECT TO authenticated USING ((SELECT private.is_staff()));

CREATE POLICY moderation_log_staff_insert ON moderation_log
  FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_staff()));

-- No UPDATE or DELETE policy anywhere on moderation_log: an audit trail that
-- can be rewritten is not an audit trail.


-- =============================================================================
-- 10. Which key does which job
-- =============================================================================
--
-- TRD section 4.2 keeps every key server-side. Within the server, the choice of
-- key is itself a security boundary:
--
--   anon key         — public reads (board, directory) and both public form
--                      INSERTs. Used even though it runs on the server, so RLS
--                      stays a real second layer instead of decoration.
--
--   service_role key — exactly two operations, and nothing else:
--                        1. RF-4 management by reference_code + manage_token.
--                           The token is validated in the Server Action; it
--                           never becomes a database credential, which is why
--                           this path cannot be expressed as an RLS policy.
--                        2. Scheduled expiry sweeps (RNF-5.9).
--
--   Moderation (RF-6) uses the authenticated user's own session, so is_staff()
--   and the audit trail apply. It does NOT use service_role.


-- =============================================================================
-- 11. Deliberately not used
-- =============================================================================
--
-- Recorded so that a reviewer can see these were considered, not overlooked.
--
--   Partitioning   — worth it past roughly 100M rows. A municipal emergency
--                    produces thousands. Declarative partitioning here would add
--                    operational cost and buy nothing.
--
--   fillfactor=90  — the usual choice for update-heavy tables. help_requests
--                    takes a handful of moderation updates per row over its
--                    14-day life; that is not hot-row churn, and autovacuum
--                    handles it. Revisit if bloat is ever measured, not before.
--
--   BRIN indexes   — for very large naturally ordered data. B-tree on created_at
--                    is correct at this size.
--
--   PostGIS        — the MVP filters by comuna. No radius, distance
--                    or polygon query exists in the TRD. Adding it now would be
--                    speculative.
--
--   EXCLUDE        — nothing in this model has overlapping ranges to prevent.
--
--   DOMAIN for phone — would centralize validation, but any pattern strict
--                    enough to be useful will reject some real number typed by
--                    someone in an emergency. Length and character class only.
--
--   citext         — no case-insensitive constraint is needed. Where
--                    case-insensitive matching is wanted, the trigram index on
--                    name already covers it.


-- =============================================================================
-- 12. Notes for future migrations
-- =============================================================================
--
--   * Adding a NOT NULL column whose DEFAULT is volatile (now(), gen_random_uuid())
--     rewrites the whole table. On a live board, add it nullable, backfill in
--     batches, then set NOT NULL.
--   * Build indexes on live tables with CREATE INDEX CONCURRENTLY. It cannot run
--     inside a transaction, so it needs its own migration step.
--   * Widening a category or status list means replacing its CHECK constraint:
--     ADD the new constraint as NOT VALID, VALIDATE it, then DROP the old one.
--     This is precisely the flexibility a native ENUM would have cost us.
--   * Identity sequences will show gaps after rollbacks. That is normal. Do not
--     try to make them consecutive.
