import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { apartments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/seo";
import { buildQueryString } from "@/lib/search-params";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Публичный справочник: id + город + все фотографии (для image sitemap).
  const rows = await db
    .select({
      id: apartments.id,
      city: apartments.city,
      image: apartments.image,
      images: apartments.images,
      updatedAt: apartments.updatedAt,
    })
    .from(apartments)
    .where(eq(apartments.status, "active"));

  const apartmentUrls: MetadataRoute.Sitemap = rows.map((a) => ({
    url: `${SITE_URL}/apartments/${a.id}`,
    lastModified: a.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
    // Все фотографии квартиры — чтобы Google индексировал изображения.
    // Если массива нет — берём главное фото.
    images: (a.images?.length ? a.images : [a.image]).filter(Boolean),
  }));

  // Популярные города из активных объявлений — для SEO-страниц каталога
  const popularCities = Array.from(new Set(rows.map((a) => a.city)));
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
