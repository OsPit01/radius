import type { GetServerSideProps } from 'next';

import { ClientSearchWrapper } from '@/components/ClientSearchWrapper';
import { JsonLd } from '@/components/JsonLd';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { type ApartmentCardData, getApartmentCardData } from '@/lib/apartment-format';
import {
    buildQueryString,
    buildSearchDescription,
    buildSearchTitle,
    parseSearchParams,
    type SearchFilters,
} from '@/lib/search-params';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { createServerCaller } from '@/trpc/server';

type HomePageProps = {
    filters: SearchFilters;
    apartments: ApartmentCardData[];
};

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (ctx) => {
    const filters = parseSearchParams(ctx.query);
    const api = await createServerCaller(ctx);
    const data = await api.apartment.getAll({
        city: filters.city,
        guests: filters.guests,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        rooms: filters.rooms,
        beds: filters.beds,
        sofas: filters.sofas,
        metro: filters.metro,
    });

    return {
        props: {
            // Next не умеет сериализовать undefined в props — убираем пустые поля.
            filters: JSON.parse(JSON.stringify(filters)) as SearchFilters,
            apartments: data.map((apartment) => getApartmentCardData(apartment)),
        },
    };
};

export default function Home({ filters, apartments }: HomePageProps) {
    const queryString = buildQueryString(filters);
    const canonicalUrl = queryString ? `${SITE_URL}/?${queryString}` : SITE_URL;

    // Структурированные данные: сайт + «поиск по сайту» (Sitelinks Searchbox).
    // Благодаря SearchAction Google может показать поле поиска прямо в выдаче.
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/?city={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <>
            <Seo
                absoluteTitle={buildSearchTitle(filters)}
                description={buildSearchDescription(filters)}
                canonical={canonicalUrl}
            />
            <JsonLd data={websiteSchema} />
            <ClientHeader />

            <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-lg:pb-10 max-md:px-5 max-md:py-[30px]">
                <div className="mx-auto max-w-[1400px] py-10 text-center">
                    <h1 className="mb-5 text-[2rem] leading-[1.2] font-bold text-foreground max-md:text-[2rem]">
                        Посуточная аренда квартир
                    </h1>

                    <h2 className="text-[1.2rem] leading-[1.5] text-muted-foreground max-md:text-base">
                        квартиры на сутки напрямую от собственников
                    </h2>

                    <ClientSearchWrapper
                        key={queryString}
                        initialFilters={filters}
                        initialApartments={apartments}
                    />
                </div>

                <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-muted-foreground max-md:mt-8 max-md:text-sm">
                    <p className="mb-4">
                        Radius — удобный способ снять квартиру на сутки. У нас только проверенные объекты от
                        собственников: актуальные фотографии, честные цены и бронирование за пару минут. Выберите город,
                        район, даты и количество гостей — и забронируйте жильё онлайн без посредников и переплат.
                    </p>
                    <p>
                        Посуточная аренда квартир на Radius — это комфорт, прозрачность и выгодные цены. Каждый объект
                        проверен, у каждого есть подробное описание и рейтинг. Снимайте квартиру на сутки надёжно —
                        напрямую от владельцев.
                    </p>
                </section>
            </main>
        </>
    );
}
