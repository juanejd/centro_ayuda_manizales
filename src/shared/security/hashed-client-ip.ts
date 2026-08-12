import { createHash } from "node:crypto";
import { headers } from "next/headers";

// Used only when no IP-bearing header is present at all — local dev without a
// reverse proxy in front of it. Never used to identify a real caller.
const LOCAL_DEV_IP_PLACEHOLDER = "local-dev-no-ip-header";

/**
 * Reads the caller's IP for rate limiting only — the raw value never reaches
 * the database. It is SHA-256 hashed before being used as check_rate_limit's
 * client_key. Shared by every route that calls check_rate_limit (publish,
 * manage/withdraw) so they key rate limits identically.
 */
export async function getHashedClientIp(): Promise<string> {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();

  const ip =
    firstForwarded || headerList.get("x-real-ip") || LOCAL_DEV_IP_PLACEHOLDER;

  return createHash("sha256").update(ip).digest("hex");
}
