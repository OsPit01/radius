import { eq } from 'drizzle-orm';
import type { GetServerSideProps } from 'next';

import { findMicrodistrictSlug, getMicrodistrictPath, MICRODISTRICT_SLUGS } from '@/lib/constants/catalog';
import { SITE_URL } from '@/lib/seo';
import { db } from '@/server/db';
import { apartments } from '@/server/db/schema';

type SitemapEntry = {
    url: string;
    lastModified: Date;
    changeFrequency: 'daily' | 'weekly' | 'yearly';
    priority: number;
    images?: string[];
};

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function renderSitemap(entries: SitemapEntry[]): string {
    const urls = entries.map((e) => {
        const images = (e.images ?? [])
            .map((src) => `<image:image><image:loc>${escapeXml(src)}</image:loc></image:image>`)
            .join('');

        return (
            `<url><loc>${escapeXml(e.url)}</loc>` +
            `<lastmod>${e.lastModified.toISOString()}</lastmod>` +
            `<changefreq>${e.changeFrequency}</changefreq>` +
            `<priority>${e.priority}</priority>${images}</url>`
        );
    });

    return (
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
        `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
        `${urls.join('\n')}\n</urlset>\n`
    );
}

async function buildEntries(): Promise<SitemapEntry[]> {
    // Публичный справочник: id + город + все фотографии (для image sitemap).
    const rows = await db
        .select({
            id: apartments.id,
            city: apartments.city,
            image: apartments.image,
            images: apartments.images,
            updatedAt: apartments.updatedAt,
            microdistrict: apartments.microdistrict,
        })
        .from(apartments)
        .where(eq(apartments.status, 'active'));

    const apartmentUrls: SitemapEntry[] = rows.map((a) => ({
        url: `${SITE_URL}/apartments/${a.id}`,
        lastModified: a.updatedAt ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        // Все фотографии квартиры — чтобы Google индексировал изображения.
        // Если массива нет — берём главное фото.
        images: (a.images?.length ? a.images : [a.image]).filter(Boolean),
    }));

    // Страницы каталога /rent/flat/{город}/microdistrict/{микрорайон}.
    // Только те, где есть хотя бы одна активная квартира: пустые страницы закрыты noindex.
    const filledSlugs = new Set(rows.map((a) => findMicrodistrictSlug(a.microdistrict, a.city)));
    const microdistrictUrls: SitemapEntry[] = MICRODISTRICT_SLUGS.filter((slug) => filledSlugs.has(slug)).map(
        (slug) => ({
            url: `${SITE_URL}${getMicrodistrictPath(slug)}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        }),
    );

    return [
        {
            url: `${SITE_URL}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...microdistrictUrls,
        {
            url: `${SITE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.1,
        },
        {
            url: `${SITE_URL}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.1,
        },
        ...apartmentUrls,
    ];
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const xml = renderSitemap(await buildEntries());

    res.setHeader('Content-Type', 'application/xml');
    // Карта сайта собирается из БД — кэшируем на CDN, чтобы не ходить в БД на каждый запрос бота.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.write(xml);
    res.end();

    return { props: {} };
};

// Next требует default-экспорт, но ответ уже отправлен в getServerSideProps.
export default function Sitemap() {
    return null;
}
