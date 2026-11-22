import { CityTiles } from '@/components/catalog/CityTiles';
import { RadarHero } from '@/components/home/RadarHero';
import { TypewriterTagline } from '@/components/home/TypewriterTagline';
import { JsonLd } from '@/components/JsonLd';
import { Seo } from '@/components/Seo';
import { HOME_TAGLINE_SEO_TEXT, HOME_TAGLINES } from '@/lib/constants/home-taglines';
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL } from '@/lib/seo';
import { Layout } from '@/shared/ui/layout';

const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
};

export default function Home() {
    return (
        <Layout withFooter>
            <Seo
                absoluteTitle={HOME_TITLE}
                description={HOME_DESCRIPTION}
                canonical={SITE_URL}
            />

            <JsonLd data={websiteSchema} />

            <RadarHero />

            <h1 className="mt-6 mb-2 px-4 text-center text-3xl font-bold text-foreground lg:text-6xl">
                Посуточная аренда квартир
            </h1>

            <TypewriterTagline
                seoText={HOME_TAGLINE_SEO_TEXT}
                phrases={HOME_TAGLINES}
                className="px-4 text-center text-sm text-muted-foreground lg:text-2xl"
            />

            <CityTiles />

            <p className="mx-auto mt-12 mb-4 px-4 text-center text-sm text-muted-foreground">
                NaRadare — удобный способ снять квартиру на сутки. у нас только проверенные объекты от собственников:
                актуальные фотографии, честные цены и бронирование за пару минут. Выберите район, подберите квартиру и
                забронируйте жильё онлайн без посредников и переплат.
            </p>

            <p className="mx-auto px-4 text-center text-sm text-muted-foreground">
                Посуточная аренда квартир NaRadare — это комфорт, прозрачность и выгодные цены. Каждый объект проверен,
                у каждого есть подробное описание и рейтинг. Снимайте квартиру на сутки надёжно — напрямую от
                владельцев.
            </p>
        </Layout>
    );
}
