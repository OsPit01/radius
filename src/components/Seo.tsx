import Head from 'next/head';

import { absoluteUrl, HOME_TITLE, SITE_DESCRIPTION, SITE_NAME, SITE_OG_IMAGE } from '@/lib/seo';

type SeoProps = {
    /** Короткий заголовок: в <title> получит суффикс « | Radius», в og:title — нет. */
    title?: string;
    /** Полный заголовок, который идёт в <title> и og:title как есть (без суффикса). */
    absoluteTitle?: string;
    description?: string;
    /** Канонический адрес: путь («/privacy») или полный URL. */
    canonical?: string;
    /** Картинка для превью ссылки (полный URL); по умолчанию — логотип сайта. */
    image?: string;
    /** Закрыть страницу от индексации. */
    noindex?: boolean;
};

/**
 * Мета-теги страницы (аналог `metadata` из App Router).
 *
 * Базовые значения выводятся из `_app`, а страница может переопределить их,
 * отрисовав свой <Seo>. У каждого тега есть `key` — по нему next/head оставляет
 * только последний (самый «глубокий») тег, а не дублирует их.
 */
export function Seo({ title, absoluteTitle, description = SITE_DESCRIPTION, canonical, image, noindex }: SeoProps) {
    const ogTitle = title ?? absoluteTitle ?? HOME_TITLE;
    const documentTitle = title ? `${title} | ${SITE_NAME}` : ogTitle;
    const ogImage = image ?? absoluteUrl(SITE_OG_IMAGE.url);
    const canonicalUrl = canonical ? absoluteUrl(canonical) : undefined;

    return (
        <Head>
            <title key="title">{documentTitle}</title>
            <meta
                key="description"
                name="description"
                content={description}
            />
            {canonicalUrl && (
                <link
                    key="canonical"
                    rel="canonical"
                    href={canonicalUrl}
                />
            )}
            {noindex && (
                <meta
                    key="robots"
                    name="robots"
                    content="noindex, nofollow"
                />
            )}

            <meta
                key="og:type"
                property="og:type"
                content="website"
            />
            <meta
                key="og:locale"
                property="og:locale"
                content="ru_RU"
            />
            <meta
                key="og:site_name"
                property="og:site_name"
                content={SITE_NAME}
            />
            <meta
                key="og:title"
                property="og:title"
                content={ogTitle}
            />
            <meta
                key="og:description"
                property="og:description"
                content={description}
            />
            {canonicalUrl && (
                <meta
                    key="og:url"
                    property="og:url"
                    content={canonicalUrl}
                />
            )}
            <meta
                key="og:image"
                property="og:image"
                content={ogImage}
            />
            {/* Размеры известны только у картинки по умолчанию */}
            {!image && (
                <>
                    <meta
                        key="og:image:width"
                        property="og:image:width"
                        content={String(SITE_OG_IMAGE.width)}
                    />
                    <meta
                        key="og:image:height"
                        property="og:image:height"
                        content={String(SITE_OG_IMAGE.height)}
                    />
                </>
            )}

            <meta
                key="twitter:card"
                name="twitter:card"
                content="summary_large_image"
            />
            <meta
                key="twitter:title"
                name="twitter:title"
                content={ogTitle}
            />
            <meta
                key="twitter:description"
                name="twitter:description"
                content={description}
            />
        </Head>
    );
}
