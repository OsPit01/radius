export const SITE_NAME = 'Radius';
export const SITE_DESCRIPTION =
    'Посуточная аренда квартир напрямую от собственников. Фото, цены, бронирование онлайн без посредников и переплат.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.radius-stay.by';

export const HOME_TITLE = 'Посуточная аренда квартир — снять на сутки | Radius';
export const HOME_DESCRIPTION =
    'Посуточная аренда квартир напрямую от собственников. Актуальные фото, честные цены, бронирование онлайн. Снимите квартиру на сутки недорого и удобно в любом городе.';

/** Фото по умолчанию для превью ссылки (Open Graph), если у страницы нет своего. */
export const SITE_OG_IMAGE = {
    url: '/apple-touch-icon.png',
    width: 180,
    height: 180,
};

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
