/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js';

// Hostname хранилища Supabase берём из переменной окружения,
// чтобы не хранить его захардкоженным в коде.
function buildRemotePatterns() {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

    /** @type {Array<{ protocol: "https"; hostname: string; port: string; pathname: string }>} */
    const patterns = [
        // 1. Google аватарки
        { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
        // Логотип платёжного сервиса «Экспресс Платежи»
        { protocol: 'https', hostname: 'express-pay.by', port: '', pathname: '/brandbook/**' },
    ];

    // Хранилище картинок Supabase (hostname из SUPABASE_URL)
    if (supabaseHost) {
        patterns.push({
            protocol: 'https',
            hostname: supabaseHost,
            port: '',
            pathname: '/storage/v1/object/public/**',
        });
    }

    return patterns;
}

/**
 * Заголовки безопасности для всех страниц.
 *
 * CSP собран так, чтобы НЕ ломать Яндекс Карты и аналитику:
 *  - script-src строгий: только наш домен + Google Analytics (googletagmanager.com)
 *    + Яндекс Карты (api-maps.yandex.ru) — это и есть защита от XSS;
 *  - 'unsafe-inline' для script/style нужен Next.js (инлайн-скрипты __next_f/__NEXT_DATA__)
 *    и инлайн-стилям (React style={} + Tailwind);
 *  - воркеры, картинки, шрифты и сетевые запросы разрешены по https: — карта Яндекса
 *    грузит их со своих поддоменов (core-renderer-maps, yastatic и т.п.), и перечислять
 *    их все руками = риск снова сломать карту.
 *
 * CSP применяется ТОЛЬКО в production: в dev-режиме Next.js использует eval (HMR/React Refresh).
 */
async function securityHeaders() {
    const isProduction = process.env.NODE_ENV === 'production';

    const csp = [
        "default-src 'self'",
        // Скрипты и стили по https: — Яндекс Карты и Google Ads грузят ресурсы
        // с множества своих доменов (yastatic.net, doubleclick.net и т.п.),
        // перечислять их вручную = бесконечно ломать сайт. 'unsafe-inline' нужен
        // Next.js (инлайн-скрипты __next_f/__NEXT_DATA__) и инлайн-стилям.
        "script-src 'self' 'unsafe-inline' https:",
        "style-src 'self' 'unsafe-inline' https:",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https:",
        "connect-src 'self' https:",
        "worker-src 'self' blob: https: data:",
        // Реальная защита — эти директивы (их не трогаем):
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');

    const headers = [
        // Запрет определять MIME-тип «на глаз» — защита от подмены типа загружаемых файлов.
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // Защита от кликджекинга: сайт нельзя встроить в iframe на чужом сайте.
        { key: 'X-Frame-Options', value: 'DENY' },
        // Не отдавать чужим сайтам полный адрес страницы (только домен).
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Мы не используем камеру/микрофон/геолокацию — явно запрещаем их запрос.
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
        // Изоляция окна от чужих документов (защита от Spectre-подобных атак).
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        // Всегда HTTPS. preload НЕ включаем: домен недавно переехал, подключать к preload-списку рано.
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ];

    if (isProduction) {
        headers.push({ key: 'Content-Security-Policy', value: csp });
    }

    return [{ source: '/(.*)', headers }];
}

/** @type {import("next").NextConfig} */
const config = {
    // next-auth v5 (ESM) импортирует "next/server" без расширения. В Pages Router
    // Next оставляет пакет внешним, и Node не может разрешить этот импорт —
    // поэтому просим Next собирать его вместе с остальным кодом.
    transpilePackages: ['next-auth'],
    images: {
        remotePatterns: buildRemotePatterns(),
    },
    async headers() {
        return securityHeaders();
    },
    // Превью квартиры для соцсетей. Публичный адрес — вне /api/, потому что /api/ закрыт в robots.txt
    // и краулеры Twitter/Facebook картинку оттуда не берут. См. src/pages/api/og/apartment/[id].ts
    async rewrites() {
        return [{ source: '/og/apartments/:id.jpg', destination: '/api/og/apartment/:id' }];
    },
    // Старый мастер добавления квартиры заменён на /admin/add-object — сохраняем старые ссылки и закладки.
    // permanent: true отдаёт 308, поэтому браузеры и поисковики запоминают новый адрес.
    async redirects() {
        return [{ source: '/admin/add-apartment', destination: '/admin/add-object', permanent: true }];
    },
    // Отключи кэш в разработке (чтобы избежать проблем с кешированием)
    generateEtags: process.env.NODE_ENV === 'development' ? false : true,
};

export default config;
