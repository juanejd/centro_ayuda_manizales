-- =============================================================================
-- Accent-insensitive full-text search over info_resources (RF-5.1)
--
-- The defect this fixes is not that search ignores accents — it is that it
-- ignores them UNPREDICTABLY, which is worse than a uniform failure because
-- nobody can learn the rule.
--
--   to_tsvector('spanish', 'Sofía')   -> 'sof'      the stemmer reads the
--                                                   accented 'ía' as a verb
--                                                   ending and strips it
--   to_tsquery ('spanish', 'sofia:*') -> 'sofi':*   no accent, no stripping
--
-- 'sofi':* does not prefix-match 'sof', so «sofia» finds nothing while
-- «donacion» finds «Donación» perfectly well, because for that word the two
-- paths happen to converge on the same lexeme. People here type without
-- accents on a phone keyboard; the acceptance criterion that «hospi» finds
-- «Hospital» is the same requirement one step short of this one.
--
-- The fix removes accents on BOTH sides before the stemmer runs, so index and
-- query always agree. src/modules/info-resources/queries.ts performs the
-- matching normalisation in toPrefixSearchQuery; the two must stay in lockstep.
-- =============================================================================

-- Supabase provisions the `extensions` schema and keeps every extension out of
-- `public`. pgcrypto and pg_trgm are already installed there by the platform
-- image, which is why section 1 of the initial schema could ask for them
-- without naming a schema and get a no-op; unaccent is not preinstalled, so
-- this one has to say where it goes.
create extension if not exists unaccent with schema extensions;

-- A STORED generated column requires an IMMUTABLE expression, and
-- unaccent(text) is only STABLE: the single-argument form resolves the
-- dictionary through search_path at call time, so its result depends on
-- session state. The two-argument form takes the dictionary as an explicit
-- regdictionary, which removes that dependency and is what makes this wrapper
-- honestly immutable rather than merely labelled so. Mislabelling the
-- one-argument form would silently corrupt the stored vectors the first time
-- anyone changed search_path.
--
-- Three further details are load-bearing:
--
--   1. It lives in `private`, the same unexposed schema as is_staff(). The
--      Data API exposes only `public` and `graphql_public`, so a function in
--      `private` can never become an RPC endpoint, and anon/authenticated hold
--      no USAGE on the schema so they cannot call it directly either. A stored
--      generated-column expression still evaluates, because EXECUTE on the
--      function is checked at run time while schema USAGE is checked only when
--      a name is resolved — the same asymmetry the RLS helper relies on.
--   2. search_path is empty and every reference is fully qualified, including
--      the dictionary literal. Without that, a caller could shadow the
--      dictionary and change what the column stores.
--   3. BEGIN ATOMIC rather than a quoted body, so PostgreSQL records the
--      dependency on the extension. With a string body, DROP EXTENSION unaccent
--      would succeed and the breakage would only surface at the next write.
create or replace function private.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
begin atomic
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1);
end;

revoke execute on function private.immutable_unaccent(text) from public;

-- Staff insert and update directory rows under their own session, and the
-- generated column is computed with that role's privileges.
grant execute on function private.immutable_unaccent(text) to authenticated;

-- A generated column's expression cannot be altered in place, so the column is
-- dropped and rebuilt. Dropping it takes info_resources_search_idx with it;
-- both come back below. Adding a STORED generated column rewrites the table,
-- which is why this is a separate migration and not an edit to the initial
-- schema — at 31 rows the rewrite is free, on a live table it would not be.
alter table public.info_resources drop column search_vector;

-- Same weighting as before: a hit on the name outranks a hit on the body,
-- which is what someone typing «hospital» expects. unaccent runs before
-- to_tsvector, never after — the stemmer has to see the normalised text or the
-- whole point is lost.
alter table public.info_resources
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', private.immutable_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('spanish', private.immutable_unaccent(coalesce(description, ''))), 'B')
  ) stored;

create index info_resources_search_idx
  on public.info_resources using gin (search_vector);
