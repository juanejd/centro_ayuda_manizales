import type { NextConfig } from "next";

/**
 * Resource photos live in Supabase Storage (RF-5.7), so `next/image` has to be
 * told which host is allowed to serve them. The host is derived from
 * `SUPABASE_URL` rather than hardcoded: the project reference differs between
 * the local stack and the hosted project, and a stale literal would silently
 * turn every shelter photo into a broken image.
 */
function supabaseImagePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    return [];
  }

  try {
    const { protocol, hostname } = new URL(supabaseUrl);

    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    // A malformed URL is already reported by the env schema at request time.
    // Failing the build here would only obscure that message.
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImagePatterns(),
  },
  // RNF: the public needs board must never be indexed or crawled — it lists
  // names, phone numbers and photos of people who just reported an
  // emergency. A <meta robots> tag alone is not enough (some crawlers only
  // honor the HTTP header), so this is enforced at the response-header
  // level for the board and every need detail page under it.
  async headers() {
    return [
      {
        source: "/necesidades",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/necesidades/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/moderacion",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/moderacion/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
