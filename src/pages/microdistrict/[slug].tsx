import type { GetServerSideProps } from 'next';

import { ApartmentsList } from '@/components/apartments/ApartmentsList';
import { Seo } from '@/components/Seo';
import { type ApartmentCardData, getApartmentCardData } from '@/lib/apartment-format';
import { getCurrencySymbol } from '@/lib/constants/currencies';
import { pluralRu } from '@/lib/plural';
import { SITE_URL } from '@/lib/seo';
import { createServerCaller } from '@/trpc/server';

type MicrodistrictPageProps = {
    slug: string;
    microdistrict: string;
    apartments: ApartmentCardData[];
};

export const getServerSideProps: GetServerSideProps<MicrodistrictPageProps> = async (ctx) => {
    const slug = ctx.params?.slug;
    if (typeof slug !== 'string') {
        return { notFound: true };
    }

    const microdistrict = decodeURIComponent(slug);

    const api = await createServerCaller(ctx);

    const data = await api.apartment.getAll({ microdistrict });
    if (data.length === 0) {
        return { notFound: true };
    }

    return {
        props: {
            slug,
            microdistrict,
            apartments: data.map((apartment) => getApartmentCardData(apartment)),
        },
    };
};

export default function MicrodistrictPage({ slug, microdistrict, apartments }: MicrodistrictPageProps) {
    // Самая дешёвая квартира ЦЕЛИКОМ (цена + валюта — пара, их нельзя разрывать).
    const cheapest = apartments.reduce((min, a) => (a.price < min.price ? a : min));

    return (
        <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-md:px-5 max-md:py-[30px]">
            <Seo
                absoluteTitle={`Квартиры на сутки — ${microdistrict} | Radius`}
                description={`Снять квартиру на сутки в микрорайоне ${microdistrict}. Актуальные фото, цены, бронирование онлайн напрямую от собственников.`}
                canonical={`${SITE_URL}/microdistrict/${encodeURIComponent(slug)}`}
            />
            <div className="mb-6 text-center">
                <h1 className="text-[2rem] font-bold max-md:text-[1.5rem]">
                    Квартиры на сутки в микрорайоне {microdistrict}
                </h1>
                <p className="mt-3 text-[1.1rem] text-[#666] max-md:text-base">
                    Найдено {apartments.length} {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')}
                </p>
            </div>
            <ApartmentsList apartments={apartments} />

            <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-[#555] max-md:mt-8 max-md:text-sm">
                <h2 className="mb-4 text-[1.4rem] font-semibold text-[#333]">
                    Снять квартиру на сутки в микрорайоне {microdistrict}
                </h2>
                <p>
                    В микрорайоне {microdistrict} доступно {apartments.length}{' '}
                    {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')} на сутки — от {cheapest.price}{' '}
                    {getCurrencySymbol(cheapest.currency)} за ночь. Все объекты сдаются напрямую от собственников:
                    актуальные фотографии, честные цены, онлайн-бронирование без посредников и скрытых комиссий.
                </p>
            </section>
        </main>
    );
}
