import { and, eq } from 'drizzle-orm';
import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

import { parseApartmentId } from '@/lib/apartment-id';
import { DEFAULT_OG_IMAGE, OG_IMAGE_SIZE } from '@/lib/seo';
import { db } from '@/server/db';
import { apartments } from '@/server/db/schema';

// Превью квартиры для Telegram / WhatsApp / соцсетей: первое фото, обрезанное до 1200×630 JPEG.
// В базе фото лежат как WebP до 1920px — их не везде показывают (WhatsApp, часть мессенджеров)
// и у них произвольные пропорции, поэтому «большая карточка» не гарантирована.
// Снаружи эндпоинт доступен как /og/apartments/[id].jpg (rewrite в next.config.js):
// /api/ закрыт в robots.txt, а Twitter и Facebook картинки оттуда не берут.

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

// Фото в превью меняются редко, а URL содержит ?v=<хеш фото> — можно кэшировать надолго.
const CACHE_OK = 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400';
const CACHE_FALLBACK = 'public, max-age=300, s-maxage=300';

/**
 * Только наше хранилище Supabase (то же правило, что images.remotePatterns в next.config.js).
 * Поле apartments.image задаёт владелец, поэтому произвольный адрес качать с сервера нельзя (SSRF).
 */
function isStorageUrl(src: string): boolean {
    const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) {
        return false;
    }
    try {
        const url = new URL(src);
        return (
            url.protocol === 'https:' &&
            url.hostname === new URL(base).hostname &&
            url.pathname.startsWith('/storage/v1/object/public/')
        );
    } catch {
        return false;
    }
}

async function renderCover(src: string): Promise<Buffer> {
    // redirect: 'error' — чтобы редиректом нельзя было уйти с нашего хранилища на чужой адрес.
    const response = await fetch(src, { redirect: 'error', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
        throw new Error(`Хранилище ответило ${response.status}`);
    }
    if (Number(response.headers.get('content-length') ?? 0) > MAX_SOURCE_BYTES) {
        throw new Error('Фото слишком большое для превью');
    }

    return sharp(Buffer.from(await response.arrayBuffer()), { failOn: 'none' })
        .rotate() // учитываем EXIF-ориентацию, иначе фото с телефона может лечь набок
        .resize(OG_IMAGE_SIZE.width, OG_IMAGE_SIZE.height, { fit: 'cover' })
        .flatten({ background: '#ffffff' }) // у PNG с прозрачностью JPEG иначе получит чёрный фон
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        res.status(405).end();
        return;
    }

    const id = parseApartmentId(req.query.id);
    if (id === null) {
        res.status(404).end();
        return;
    }

    // Как на странице объекта (apartment.getByIdPublic): снаружи видны только опубликованные квартиры.
    const [apartment] = await db
        .select({ image: apartments.image, images: apartments.images })
        .from(apartments)
        .where(and(eq(apartments.id, id), eq(apartments.status, 'active')));

    if (!apartment) {
        res.setHeader('Cache-Control', CACHE_FALLBACK);
        res.status(404).end();
        return;
    }

    // Первое фото — то же, что открывается первым в галерее на странице объекта.
    const cover = apartment.images?.[0] ?? apartment.image;

    if (cover && isStorageUrl(cover)) {
        try {
            const jpeg = await renderCover(cover);
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', CACHE_OK);
            res.status(200).send(jpeg);
            return;
        } catch (error) {
            console.error(`og: не удалось собрать превью квартиры ${id}`, error);
        }
    }

    // Нет фото или оно недоступно — вместо битой картинки отдаём логотип сайта.
    res.setHeader('Cache-Control', CACHE_FALLBACK);
    res.redirect(302, DEFAULT_OG_IMAGE);
}
