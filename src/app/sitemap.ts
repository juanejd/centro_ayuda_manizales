import type { MetadataRoute } from "next";

import { listResources } from "@/modules/info-resources/queries";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const resources = await listResources({ limit: 500 });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "hourly" },
    { url: `${siteUrl}/informacion`, changeFrequency: "hourly" },
    { url: `${siteUrl}/lineas-atencion`, changeFrequency: "daily" },
    { url: `${siteUrl}/que-hacer`, changeFrequency: "monthly" },
    { url: `${siteUrl}/aviso-de-privacidad`, changeFrequency: "yearly" },
    { url: `${siteUrl}/asesoria-juridica`, changeFrequency: "monthly" },
  ];

  const resourceRoutes: MetadataRoute.Sitemap = resources.map((resource) => ({
    url: `${siteUrl}/informacion/${resource.slug}`,
    changeFrequency: "hourly",
  }));

  return [...staticRoutes, ...resourceRoutes];
}
