import { ApartmentsList } from '@/components/apartments/ApartmentsList';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import type { ApartmentCardData } from '@/lib/apartment-format';
import { formatByn } from '@/lib/constants/currencies';
import { cityInPrepositional } from '@/lib/declension';
import { pluralRu } from '@/lib/plural';
import { SITE_URL } from '@/lib/seo';
import { transliterate } from '@/lib/transliterate';

type CityCatalogPageProps = {
    city: string;
    apartments: ApartmentCardData[];
};

/**
 * Страница каталога «Квартиры на сутки в {городе}»: /rent/flat/{слаг-города}.
 * Чистая витрина одного населённого пункта — без логики определения слага
 * (ею занимается pages/rent/flat/[city]/index.tsx).
 */
export function CityCatalogPage({ city, apartments }: CityCatalogPageProps) {
    // Предложный падеж: «Минске». Неизвестный словарю город → «городе Минск»
    // (null словаря подменяем безопасной формой через ??).
    const cityIn = cityInPrepositional(city) ?? `городе ${city}`;
    const cheapest = apartments.reduce((min, a) => (a.price < min.price ? a : min));

    return (
        <>
            <Seo
                absoluteTitle={`Квартиры на сутки в ${cityIn} — снять`}
                description={`Снять квартиру на сутки в ${cityIn}. Актуальные фото, цены, бронирование онлайн напрямую от собственников.`}
                canonical={`${SITE_URL}/rent/flat/${transliterate(city)}`}
            />
            <ClientHeader />

            <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-md:px-5 max-md:py-[30px]">
                <div className="mb-6 text-center">
                    <h1 className="text-[2rem] font-bold max-md:text-[1.5rem]">Квартиры на сутки в {cityIn}</h1>
                    <p className="mt-3 text-[1.1rem] text-muted-foreground max-md:text-base">
                        Найдено {apartments.length} {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')}
                    </p>
                </div>

                <ApartmentsList apartments={apartments} />

                <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-muted-foreground max-md:mt-8 max-md:text-sm">
                    <h2 className="mb-4 text-[1.4rem] font-semibold text-foreground">
                        Снять квартиру на сутки в {cityIn}
                    </h2>
                    {/* SEO-текст: БЕЗ количества объектов — число устаревает при каждом
                        изменении каталога, а Google это замечает. Вместо числа — польза:
                        что можно снять, от какой цены, как происходит бронирование. */}
                    <p>
                        Квартиры на сутки в {cityIn} от {formatByn(cheapest.price)} за ночь: студии, одну- и
                        двухкомнатные квартиры с фото, честными ценами и онлайн-бронированием напрямую от собственников
                        — без посредников и скрытых комиссий.
                    </p>
                </section>
            </main>
        </>
    );
}
