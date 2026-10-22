import type { GetServerSideProps } from 'next';

import { findMicrodistrictSlug, getMicrodistrictPath } from '@/lib/constants/catalog';

// Старый адрес страницы микрорайона: /microdistrict/Новая%20боровая.
// Каталог переехал на /rent/flat/minsk/microdistrict/newbor — отправляем туда постоянным
// редиректом, чтобы не потерять ссылки и позиции в поиске. Неизвестных микрорайонов в каталоге нет — 404.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
    // Next уже декодирует параметры пути, повторный decodeURIComponent не нужен.
    const name = ctx.params?.slug;
    const slug = typeof name === 'string' ? findMicrodistrictSlug(name) : undefined;

    if (!slug) {
        return { notFound: true };
    }
    return { redirect: { destination: getMicrodistrictPath(slug), permanent: true } };
};

// Next требует default-экспорт, но ответ — редирект или 404 — уходит из getServerSideProps.
export default function LegacyMicrodistrictPage() {
    return null;
}
