import type { GetServerSideProps } from 'next';

import { MicrodistrictListing } from '@/components/catalog/MicrodistrictListing';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { type ApartmentCardData, getApartmentCardData } from '@/lib/apartment-format';
import { getMicrodistrictSeo } from '@/lib/catalog-seo';
import {
    CITIES,
    CitySlug,
    getMicrodistrictPath,
    isMicrodistrictSlug,
    MICRODISTRICTS,
    type MicrodistrictSlug,
} from '@/lib/constants/catalog';
import { createServerCaller } from '@/trpc/server';

// Адрес страницы: /rent/flat/minsk/microdistrict/{микрорайон}.
// «Минск» — это папка minsk в пути к файлу; микрорайоны других городов здесь не открываются.
const CITY = CitySlug.Minsk;

type MicrodistrictPageProps = {
    slug: MicrodistrictSlug;
    apartments: ApartmentCardData[];
};

export const getServerSideProps: GetServerSideProps<MicrodistrictPageProps> = async (ctx) => {
    const slug = ctx.params?.microdistrict;
    if (typeof slug !== 'string' || !isMicrodistrictSlug(slug) || MICRODISTRICTS[slug].city !== CITY) {
        return { notFound: true };
    }

    const api = await createServerCaller(ctx);

    // Только квартиры этого микрорайона в этом городе.
    const data = await api.apartment.getAll({
        exactCity: CITIES[CITY].dbName,
        microdistrict: MICRODISTRICTS[slug].dbName,
    });

    return {
        props: {
            slug,
            apartments: data.map((apartment) => getApartmentCardData(apartment)),
        },
    };
};

export default function MicrodistrictPage({ slug, apartments }: MicrodistrictPageProps) {
    const seo = getMicrodistrictSeo(slug, apartments);

    return (
        <>
            <Seo
                absoluteTitle={seo.title}
                description={seo.description}
                canonical={getMicrodistrictPath(slug)}
                // Пустую страницу в индекс не пускаем (в sitemap её тоже нет) — появится вместе с первой квартирой.
                noindex={apartments.length === 0}
            />
            <ClientHeader />

            <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-md:px-5 max-md:py-[30px]">
                <MicrodistrictListing
                    slug={slug}
                    apartments={apartments}
                />
            </main>
        </>
    );
}
