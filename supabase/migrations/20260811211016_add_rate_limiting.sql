-- =============================================================================
-- Rate limiting — Fase 4 (RF-4.5), used by the publish Server Action (unit 4.4)
--
-- 5 submissions per 10 minutes per IP on the publish path. The IP itself never
-- reaches this table: the Server Action hashes it (SHA-256) before calling
-- check_rate_limit(), so client_key is always a hash, never a raw address.
-- =============================================================================

CREATE TABLE rate_limit_hits (
  hit_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope       TEXT        NOT NULL CHECK (length(scope) <= 60),
  client_key  TEXT        NOT NULL CHECK (length(client_key) <= 128),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX rate_limit_hits_lookup_idx ON rate_limit_hits (scope, client_key, created_at DESC);

ALTER TABLE rate_limit_hits ENABLE ROW LEVEL SECURITY;
-- No policies at all: the table is reached only through check_rate_limit() below,
-- never directly. RLS is on so a future accidental GRANT doesn't quietly open it.
REVOKE ALL ON rate_limit_hits FROM anon, authenticated;

-- Deliberately in the PUBLIC schema, not `private` (unlike private.is_staff()):
-- PostgREST/`.rpc()` only exposes functions from the schemas listed in
-- supabase/config.toml's `api.schemas` (public, graphql_public). A function in
-- `private` cannot be called via supabase.rpc() at all — this one MUST be
-- callable directly by the anon role, so it has to live here. The isolation
-- instead comes from REVOKE ALL above plus SECURITY DEFINER letting only this
-- function reach the table.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_scope text,
  p_client_key text,
  p_max_hits integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.rate_limit_hits
  WHERE scope = p_scope
    AND client_key = p_client_key
    AND created_at > now() - make_interval(secs => p_window_seconds);

  IF v_count >= p_max_hits THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_hits (scope, client_key) VALUES (p_scope, p_client_key);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO anon, authenticated;
