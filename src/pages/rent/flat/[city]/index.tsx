import type { GetServerSideProps } from 'next';

import { ApartmentsList } from '@/components/apartments/ApartmentsList';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { type ApartmentCardData, getApartmentCardData } from '@/lib/apartment-format';
import { getCurrencySymbol } from '@/lib/constants/currencies';
import { pluralRu } from '@/lib/plural';
import { SITE_URL } from '@/lib/seo';
import { transliterate } from '@/lib/transliterate';
import { createServerCaller } from '@/trpc/server';

type CityPageProps = {
    city: string;
    apartments: ApartmentCardData[];
};

export const getServerSideProps: GetServerSideProps<CityPageProps> = async (ctx) => {
    const city = ctx.params?.city;
    if (typeof city !== 'string') {
        return { notFound: true };
    }
    const slug = transliterate(city);
    // Если пришёл кириллический город (или в другом регистре) — 301-редирект на канонический слаг.
    if (slug !== city) {
        return { redirect: { destination: `/rent/flat/${slug}`, permanent: true } };
    }
    const api = await createServerCaller(ctx);
    // Берём список всех городов и ищем тот, чей транслит совпадает со слагом.
    const locations = await api.apartment.getCatalogLocations();
    const match = locations.find((l) => transliterate(l.city) === slug);
    if (!match) {
        return { notFound: true }; // слаг не найден → 404
    }
    const decodedCity = match.city; // "Минск - настоящее имя для запроса"
    const data = await api.apartment.getAll({ exactCity: decodedCity });

    if (data.length === 0) {
        return { notFound: true };
    }

    return {
        props: {
            city: decodedCity,
            apartments: data.map((apartment) => getApartmentCardData(apartment)),
        },
    };
};

export default function CityPage({ city, apartments }: CityPageProps) {
    const cheapest = apartments.reduce((min, a) => (a.price < min.price ? a : min));

    return (
        <>
            <Seo
                absoluteTitle={`Квартиры на сутки в ${city} — снять | NaRadare`}
                description={`Снять квартиру на сутки в ${city}. Актуальные фото, цены, бронирование онлайн напрямую от собственников.`}
                canonical={`${SITE_URL}/rent/flat/${transliterate(city)}`}
            />
            <ClientHeader />

            <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-md:px-5 max-md:py-[30px]">
                <div className="mb-6 text-center">
                    <h1 className="text-[2rem] font-bold max-md:text-[1.5rem]">Квартиры на сутки в {city}</h1>
                    <p className="mt-3 text-[1.1rem] text-muted-foreground max-md:text-base">
                        Найдено {apartments.length} {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')}
                    </p>
                </div>

                <ApartmentsList apartments={apartments} />

                <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-muted-foreground max-md:mt-8 max-md:text-sm">
                    <h2 className="mb-4 text-[1.4rem] font-semibold text-foreground">
                        Снять квартиру на сутки в {city}
                    </h2>
                    <p>
                        В городе {city} доступно {apartments.length}{' '}
                        {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')} на сутки — от {cheapest.price}{' '}
                        {getCurrencySymbol(cheapest.currency)} за ночь. Все объекты сдаются напрямую от собственников:
                        актуальные фотографии, честные цены, онлайн-бронирование без посредников и скрытых комиссий.
                    </p>
                </section>
            </main>
        </>
    );
}
