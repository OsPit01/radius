import type { MetadataRoute } from "next";
import { api } from "@/trpc/server";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const caller = await api();
  const apartments = await caller.apartment.getAll();

  const apartmentUrls: MetadataRoute.Sitemap = apartments.map((item) => ({
    url: `${SITE_URL}/apartments/${item.apartment.id}`,
    lastModified: item.apartment.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.1,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.1,
    },
    ...apartmentUrls,
  ];
}
