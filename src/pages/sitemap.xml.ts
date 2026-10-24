import { eq } from 'drizzle-orm';
import type { GetServerSideProps } from 'next';

import { SITE_URL } from '@/lib/seo';
import { transliterate } from '@/lib/transliterate';
import { db } from '@/server/db';
import { apartments } from '@/server/db/schema';

type SitemapEntry = {
    url: string;
    lastModified: Date;
    changeFrequency: 'daily' | 'weekly' | 'yearly';
    priority: number;
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
        return (
            `<url><loc>${escapeXml(e.url)}</loc>` +
            `<lastmod>${e.lastModified.toISOString()}</lastmod>` +
            `<changefreq>${e.changeFrequency}</changefreq>` +
            `<priority>${e.priority}</priority></url>`
        );
    });

    return (
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `${urls.join('\n')}\n</urlset>\n`
    );
}

async function buildEntries(): Promise<SitemapEntry[]> {
    const rows = await db
        .select({
            id: apartments.id,
            city: apartments.city,
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
    }));

    // Страницы городов /rent/flat/{город}.
    const cities = Array.from(new Set(rows.map((a) => a.city)));
    const cityUrls: SitemapEntry[] = cities.map((city) => ({
        url: `${SITE_URL}/rent/flat/${transliterate(city)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
    }));

    // Страницы микрорайонов /rent/flat/{город}/microdistrict/{район} — только непустые районы активных квартир.
    const seen = new Set<string>();
    const microdistrictUrls: SitemapEntry[] = [];
    for (const a of rows) {
        if (!a.microdistrict) {
            continue;
        }
        const key = `${a.city}::${a.microdistrict}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        microdistrictUrls.push({
            url: `${SITE_URL}/rent/flat/${transliterate(a.city)}/microdistrict/${transliterate(a.microdistrict)}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        });
    }

    return [
        {
            url: `${SITE_URL}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...cityUrls,
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
