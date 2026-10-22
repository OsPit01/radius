export const SITE_NAME = 'Radius';
export const SITE_DESCRIPTION =
    'Посуточная аренда квартир напрямую от собственников. Фото, цены, бронирование онлайн без посредников и переплат.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.radius-stay.by';

export const HOME_TITLE = 'Посуточная аренда квартир — снять на сутки | Radius';
export const HOME_DESCRIPTION =
    'Посуточная аренда квартир напрямую от собственников. Актуальные фото, честные цены, бронирование онлайн. Снимите квартиру на сутки недорого и удобно в любом городе.';

// ===== ПРЕВЬЮ ССЫЛКИ (Open Graph) =====

/** Размер всех картинок превью: 1.91:1 — так Telegram, WhatsApp, Facebook рисуют «большую карточку». */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export type OgTheme = 'light' | 'dark';

/** Логотип по центру на фоне темы. Файлы лежат в public/og и собираются скриптом `npm run og:generate`. */
export const SITE_OG_IMAGES: Record<OgTheme, string> = {
    light: '/og/default-light.png',
    dark: '/og/default-dark.png',
};

/**
 * Краулер (Telegram, WhatsApp...) не знает тему посетителя: у него нет ни localStorage,
 * ни prefers-color-scheme — на один адрес он получает одну картинку. Поэтому для страниц
 * без своего фото выбираем одну тему; светлая версия остаётся в public/og на случай, если понадобится.
 */
export const DEFAULT_OG_THEME: OgTheme = 'dark';

/** Картинка превью по умолчанию — для страниц без своего фото. */
export const DEFAULT_OG_IMAGE = SITE_OG_IMAGES[DEFAULT_OG_THEME];

/** Короткий хеш строки: ключ для сброса кэша превью, когда у квартиры меняется главное фото. */
function shortHash(value: string): string {
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 33) ^ value.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
}

/**
 * Адрес превью квартиры — её первое фото, обрезанное до 1200×630 (отдаёт src/pages/api/og/apartment/[id].ts).
 * Лежит не в /api/, потому что /api/ закрыт в robots.txt — Twitter и Facebook такую картинку бы не взяли
 * (маршрут → /api/ переписывается в next.config.js). `v` меняется вместе с фото и сбрасывает кэш.
 */
export function getApartmentOgImagePath(apartmentId: number, firstPhoto: string): string {
    return `/og/apartments/${apartmentId}.jpg?v=${shortHash(firstPhoto)}`;
}

/**
 * Закрытые разделы: они и в robots.txt (Disallow), и мета-тегом noindex.
 * Страница считается закрытой, если её путь совпадает с этим префиксом.
 */
export const NOINDEX_PATHS = ['/auth', '/profile', '/my-apartments', '/my-notifications', '/admin'];

/** Относительный путь → абсолютный URL сайта (canonical и og:image должны быть абсолютными). */
export function absoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//.test(pathOrUrl)) {
        return pathOrUrl;
    }
    return `${SITE_URL.replace(/\/$/, '')}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
