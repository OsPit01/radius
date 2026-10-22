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

/** @type {import("next").NextConfig} */
const config = {
    // next-auth v5 (ESM) импортирует "next/server" без расширения. В Pages Router
    // Next оставляет пакет внешним, и Node не может разрешить этот импорт —
    // поэтому просим Next собирать его вместе с остальным кодом.
    transpilePackages: ['next-auth'],
    images: {
        remotePatterns: buildRemotePatterns(),
    },
    // Превью квартиры для соцсетей. Публичный адрес — вне /api/, потому что /api/ закрыт в robots.txt
    // и краулеры Twitter/Facebook картинку оттуда не берут. См. src/pages/api/og/apartment/[id].ts
    async rewrites() {
        return [{ source: '/og/apartments/:id.jpg', destination: '/api/og/apartment/:id' }];
    },
    // Отключи кэш в разработке (чтобы избежать проблем с кешированием)
    generateEtags: process.env.NODE_ENV === 'development' ? false : true,
};

export default config;
