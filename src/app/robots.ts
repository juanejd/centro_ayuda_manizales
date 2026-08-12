import type { MetadataRoute } from "next";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    // RF-2 (tablero público): names, phone numbers, and photos of people
    // who just reported an emergency must never be crawlable or indexed.
    // RF-6 (moderación): a staff login/inbox has no reason to be indexed
    // either.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/necesidades", "/moderacion"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
