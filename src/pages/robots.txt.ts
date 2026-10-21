import type { GetServerSideProps } from 'next';

import { NOINDEX_PATHS, SITE_URL } from '@/lib/seo';

const DISALLOW = ['/api/', ...NOINDEX_PATHS, '/_next/'];

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const body = [
        'User-Agent: *',
        'Allow: /',
        ...DISALLOW.map((path) => `Disallow: ${path}`),
        '',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        '',
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.write(body);
    res.end();

    return { props: {} };
};

// Next требует default-экспорт, но ответ уже отправлен в getServerSideProps.
export default function Robots() {
    return null;
}
