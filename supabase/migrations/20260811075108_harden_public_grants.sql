-- Replace Supabase's broad public-schema defaults with the privileges required
-- by the existing RLS policies. RLS remains the row-authorization boundary.
revoke all privileges on table
  public.comunas,
  public.neighborhoods,
  public.info_resources,
  public.info_resource_photos,
  public.public_help_requests
from anon, authenticated;

grant select on table
  public.comunas,
  public.neighborhoods,
  public.info_resources,
  public.info_resource_photos,
  public.public_help_requests
to anon, authenticated;

grant insert, update, delete on table
  public.comunas,
  public.neighborhoods,
  public.info_resources,
  public.info_resource_photos
to authenticated;

-- Identity sequences are usable only by the roles that can insert into their
-- owning tables. SELECT and UPDATE on these sequences remain revoked.
revoke all privileges on sequence
  public.help_requests_request_id_seq,
  public.help_offers_offer_id_seq,
  public.info_resources_resource_id_seq,
  public.info_resource_photos_photo_id_seq,
  public.moderation_log_log_id_seq
from anon, authenticated;

grant usage on sequence
  public.help_requests_request_id_seq,
  public.help_offers_offer_id_seq
to anon;

grant usage on sequence
  public.info_resources_resource_id_seq,
  public.info_resource_photos_photo_id_seq,
  public.moderation_log_log_id_seq
to authenticated;
