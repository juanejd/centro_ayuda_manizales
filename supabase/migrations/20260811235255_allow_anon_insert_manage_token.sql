-- =============================================================================
-- Fix unit 4.4/4.5 verification blocker: anon could not read back the row it
-- just inserted into help_requests.
--
-- publish.ts used `.insert(...).select("reference_code, manage_token").single()`
-- on the anon client. `.select()` after an insert compiles to `INSERT ...
-- RETURNING`, and RETURNING requires SELECT privilege on the returned
-- columns — a privilege `anon` deliberately never has on help_requests (see
-- harden_public_grants.sql), because manage_token must never be readable
-- back through the API: any client able to SELECT it for other rows could
-- withdraw or edit someone else's publication.
--
-- The fix does NOT add SELECT. The Server Action generates manage_token
-- itself with Node's crypto.randomUUID() (same entropy as gen_random_uuid())
-- BEFORE the insert and supplies it explicitly, so it never needs to read it
-- back. This grant is what lets it supply that column; the column stays
-- write-only for anon, exactly like every other column here.
-- =============================================================================

GRANT INSERT (manage_token) ON help_requests TO anon;
