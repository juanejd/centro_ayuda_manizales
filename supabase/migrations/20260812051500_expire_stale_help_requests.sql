-- =============================================================================
-- Unit 4.10 — automatic expiry (RNF-5.9)
--
-- public_help_requests already filters expires_at > now() and hides
-- fulfilled requests 48h after resolved_at, so visibility is correct on
-- every read even without this job. What's missing without it: that
-- filtering lives ONLY in the public view's WHERE clause, so a direct read
-- of help_requests (e.g. a future staff/moderation screen using the
-- authenticated + is_staff() policy) would still see every expired row as
-- if it were active. This job makes the expiry a real state transition —
-- moderation_status = 'oculta' — so it's true everywhere, not just behind
-- the public view, and survives however future screens choose to query the
-- table directly.
--
-- 'oculta' (not 'retirada'): retirada is reserved for the person's own
-- choice via unit 4.9 and is paired with withdrawn_at by a CHECK
-- constraint. Automatic expiry is a policy outcome, not a self-withdrawal,
-- so it does not set withdrawn_at.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION expire_stale_help_requests()
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.help_requests
  SET moderation_status = 'oculta'
  WHERE moderation_status IN ('sin_verificar', 'verificado', 'duplicado')
    AND (
      expires_at <= now()
      OR (fulfillment_status = 'atendida' AND resolved_at <= now() - INTERVAL '48 hours')
    );
$$;

-- Hourly is frequent enough that the 48h/14-day windows in the checklist
-- are never off by more than an hour, and cheap enough given both
-- predicates hit indexed columns (help_requests_expires_at_idx already
-- exists; resolved_at is unindexed but only scans rows already narrowed by
-- the moderation_status/fulfillment_status conditions first).
SELECT cron.schedule(
  'expire-stale-help-requests',
  '0 * * * *',
  $$SELECT expire_stale_help_requests()$$
);
