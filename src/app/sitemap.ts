import type { MetadataRoute } from "next";
import { api } from "@/trpc/server";
import { SITE_URL } from "@/lib/seo";
import { buildQueryString } from "@/lib/search-params";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const caller = await api();
  const apartments = await caller.apartment.getAll();

  const apartmentUrls: MetadataRoute.Sitemap = apartments.map((item) => ({
    url: `${SITE_URL}/apartments/${item.apartment.id}`,
    lastModified: item.apartment.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Популярные города из активных объявлений — для SEO-страниц каталога
  const popularCities = Array.from(
    new Set(apartments.map((item) => item.apartment.city)),
  );
  const catCityUrls: MetadataRoute.Sitemap = popularCities.map((city) => ({
    url: `${SITE_URL}/?${buildQueryString({ city })}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // Популярные комбинации «город + количество комнат»
  const roomCombos: MetadataRoute.Sitemap = popularCities.flatMap((city) =>
    [1, 2, 3].map((rooms) => ({
      url: `${SITE_URL}/?${buildQueryString({ city, rooms })}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    })),
  );

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...catCityUrls,
    ...roomCombos,
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
