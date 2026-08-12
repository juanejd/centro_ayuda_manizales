-- =============================================================================
-- Fase 6-B — Institutional content management (units 6.5-6.7)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. info_resources_verified_has_timestamp -> info_resources_verified_complete
-- -----------------------------------------------------------------------------
--
-- The original constraint only required verified_at when status =
-- 'verificado', unlike its sibling help_requests_verified_complete (which
-- requires BOTH verified_at AND verified_source together). RI-6 and unit
-- 6.5's own "Comprobación" ("Al marcar verificado se exigen fuente y
-- fecha") require both for an institutional resource too: someone reading it
-- makes a displacement decision based on it, so an unsourced "verificado" is
-- worse than an honest "pendiente".

ALTER TABLE info_resources
  DROP CONSTRAINT info_resources_verified_has_timestamp;

ALTER TABLE info_resources
  ADD CONSTRAINT info_resources_verified_complete CHECK (
    status <> 'verificado'
    OR (verified_at IS NOT NULL AND source IS NOT NULL AND length(source) > 0)
  );


-- -----------------------------------------------------------------------------
-- 2. moderation_log — widen entity_type/action for units 6.5-6.7
-- -----------------------------------------------------------------------------
--
-- 'alert' joins the polymorphic entity_type set (info_resource already
-- exists). 'create' covers a brand-new resource/alert; 'expire' covers
-- unit 6.7's "vencer" action (set expires_at to now(), distinct from
-- 'unpublish' which is a separate, reversible state).

ALTER TABLE moderation_log
  DROP CONSTRAINT moderation_log_entity_type_check;

ALTER TABLE moderation_log
  ADD CONSTRAINT moderation_log_entity_type_check CHECK (entity_type IN (
    'help_request', 'help_offer', 'info_resource', 'alert'));

ALTER TABLE moderation_log
  DROP CONSTRAINT moderation_log_action_check;

ALTER TABLE moderation_log
  ADD CONSTRAINT moderation_log_action_check CHECK (action IN (
    'verify', 'hide', 'withdraw', 'mark_duplicate', 'set_priority',
    'resolve', 'update', 'publish', 'unpublish', 'create', 'expire'));


-- -----------------------------------------------------------------------------
-- 3. alerts — TRD RF-6.9 / unit 6.7
-- -----------------------------------------------------------------------------
--
-- Replaces the hardcoded ALERTS array in src/modules/info-resources/alerts.ts.
-- expires_at is nullable: null means "no expiry", matching the source array's
-- own convention. Expiry is evaluated at read time (RLS predicate below, plus
-- an explicit filter in the query layer) rather than by a background job —
-- unit 6.7's whole point is that a passed expiry disappears "sin intervención
-- manual".

CREATE TABLE alerts (
  alert_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title                 TEXT        NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
  description            TEXT        NOT NULL CHECK (length(description) BETWEEN 2 AND 4000),

  -- Same "an alert without a source is unverifiable" rule as info_resources.
  source                TEXT        NOT NULL CHECK (length(source) > 0 AND length(source) <= 200),

  expires_at            TIMESTAMPTZ,
  is_published          BOOLEAN     NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TRIGGER alerts_touch
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- The home page's read path: published, not-yet-expired, most recent first.
CREATE INDEX alerts_published_idx ON alerts (is_published, expires_at);

-- FK index (not automatic).
CREATE INDEX alerts_updated_by_idx ON alerts (updated_by);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON alerts TO anon, authenticated;

CREATE POLICY alerts_public_read ON alerts
  FOR SELECT TO anon, authenticated
  USING (is_published AND (expires_at IS NULL OR expires_at > now()));

GRANT INSERT, UPDATE, DELETE ON alerts TO authenticated;

CREATE POLICY alerts_staff_all ON alerts
  FOR ALL TO authenticated USING ((SELECT private.is_staff())) WITH CHECK ((SELECT private.is_staff()));
