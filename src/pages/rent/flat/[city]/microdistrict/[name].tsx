import type { GetServerSideProps } from 'next';

import { ApartmentsList } from '@/components/apartments/ApartmentsList';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { type ApartmentCardData, getApartmentCardData } from '@/lib/apartment-format';
import { getMicrodistrictBlurb } from '@/lib/constants';
import { formatByn } from '@/lib/constants/currencies';
import { districtInPrepositional } from '@/lib/declension';
import { pluralRu } from '@/lib/plural';
import { SITE_URL } from '@/lib/seo';
import { transliterate } from '@/lib/transliterate';
import { createServerCaller } from '@/trpc/server';

type MicrodistrictPageProps = {
    city: string;
    name: string;
    apartments: ApartmentCardData[];
};

// Старые написания районов, которые могли попасть в индекс поисковиков до
// склейки данных (например, «Маяк Минск» жил по адресу mayak-minsk, а канон
// «Маяк Минска» — mayak-minska). Ключ — старый слаг, значение — канонический.
// 301 (permanent) переводит вес старой страницы на новую, а не теряет его.
const MICRODISTRICT_SLUG_ALIASES: Record<string, string> = {
    'minsk/mayak-minsk': 'minsk/mayak-minska',
};

// «Кладбище» районов: районы, которые УДАЛЕНЫ из справочника, но их страницы
// могли попасть в индекс поисковиков. Значение — слаг города, куда ведём 301:
// район исчез → человеку с поиска логичнее показать все квартиры города.
// Отдельная таблица (а не в SLUG_ALIASES выше), потому что адрес назначения
// другого формата: город (/rent/flat/minsk), а не район (/microdistrict/...).
const RETIRED_MICRODISTRICT_SLUGS: Record<string, string> = {
    // «Вокзал» убран из справочника (оставили только «ЖД Вокзал»): у трёх
    // квартир в БД район ещё прописан, но страницей района он больше не
    // канонизируется → похоронен с 301 на город.
    vokzal: 'minsk',
};

export const getServerSideProps: GetServerSideProps<MicrodistrictPageProps> = async (ctx) => {
    const citySlug = ctx.params?.city;
    const nameSlug = ctx.params?.name;
    if (typeof citySlug !== 'string' || typeof nameSlug !== 'string') {
        return { notFound: true };
    }

    // Если город или район пришли кириллицей (или в другом регистре) — 301-редирект на канонический слаг.
    const normalizedCity = transliterate(citySlug);
    const normalizedName = transliterate(nameSlug);
    if (normalizedCity !== citySlug || normalizedName !== nameSlug) {
        return {
            redirect: {
                destination: `/rent/flat/${normalizedCity}/microdistrict/${normalizedName}`,
                permanent: true,
            },
        };
    }

    // Устаревшее написание района (могло остаться в индексе) → 301 на канон.
    // Смотрим ДО запроса к БД: это просто редирект, данные не нужны.
    const aliased = MICRODISTRICT_SLUG_ALIASES[`${citySlug}/${nameSlug}`];
    if (aliased) {
        return {
            redirect: {
                destination: `/rent/flat/${aliased.split('/')[0]}/microdistrict/${aliased.split('/')[1]}`,
                permanent: true,
            },
        };
    }

    // Похороненный район (удалён из справочника): страницу уже не построить —
    // 301 на страницу города, чтобы вес из поиска не пропал в 404.
    // Тоже ДО запроса к БД: редиректу данные не нужны.
    const retiredCity = RETIRED_MICRODISTRICT_SLUGS[nameSlug];
    if (retiredCity) {
        return {
            redirect: {
                destination: `/rent/flat/${retiredCity}`,
                permanent: true,
            },
        };
    }

    const api = await createServerCaller(ctx);
    const locations = await api.apartment.getCatalogLocations();
    const cityMatch = locations.find((l) => transliterate(l.city) === citySlug);
    if (!cityMatch) {
        return { notFound: true };
    }
    const city = cityMatch.city;
    // 2. Обратный поиск РАЙОНА: внутри районов этого города ищем по слагу.
    const nameMatch = cityMatch.microdistricts.find((m) => transliterate(m) === nameSlug);
    if (!nameMatch) {
        return { notFound: true };
    }
    const name = nameMatch;

    const data = await api.apartment.getAll({
        exactCity: city,
        microdistrict: name,
    });

    if (data.length === 0) {
        return { notFound: true };
    }

    return {
        props: {
            city: city,
            name: name,
            apartments: data.map((apartment) => getApartmentCardData(apartment)),
        },
    };
};

export default function MicrodistrictPage({ city, name, apartments }: MicrodistrictPageProps) {
    // Район в предложном падеже с предлогом: «Маяк Минска» → «на Маяке Минска».
    // Слово «микрорайон» из заголовков убрано: в поисковых запросах его не пишут.
    const districtIn = districtInPrepositional(name);
    const cheapest = apartments.reduce((min, a) => (a.price < min.price ? a : min));

    // ===== Живые данные для SEO-абзаца: вычисляем, а не пишем руками =====
    // (не устаревают никогда — всегда соответствуют реальным квартирам).
    // Самая дорогая квартира: reduce «оставь ту, что дороже» (как cheapest, наоборот).
    const priciest = apartments.reduce((max, a) => (a.price > max.price ? a : max));
    // Диапазон цен: одна цена → «от 155 Br»; разброс → «от 155 до 300 Br».
    const priceRange =
        cheapest.price === priciest.price
            ? `от ${formatByn(cheapest.price)}`
            : `от ${formatByn(cheapest.price)} до ${formatByn(priciest.price)}`;
    // Метро: минимум по квартирам, где указано (minsToMetro > 0).
    // null = ни у одной квартиры метро нет → блок про метро не пишем вовсе.
    const minMetro = apartments.reduce<number | null>(
        (min, a) => (a.minsToMetro && a.minsToMetro > 0 ? Math.min(min ?? a.minsToMetro, a.minsToMetro) : min),
        null,
    );
    // Рукописное описание района из справочника (или null — район без описания).
    const blurb = getMicrodistrictBlurb(city, name);

    return (
        <>
            <Seo
                absoluteTitle={`Квартиры на сутки ${districtIn} — ${city}`}
                description={`Снять квартиру на сутки ${districtIn} (${city}). Актуальные фото, цены, бронирование онлайн напрямую от собственников.`}
                canonical={`${SITE_URL}/rent/flat/${transliterate(city)}/microdistrict/${transliterate(name)}`}
            />
            <ClientHeader />

            <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-md:px-5 max-md:py-[30px]">
                <div className="mb-6 text-center">
                    <h1 className="text-[2rem] font-bold max-md:text-[1.5rem]">Квартиры на сутки {districtIn}</h1>
                    <p className="mt-3 text-[1.1rem] text-muted-foreground max-md:text-base">
                        Найдено {apartments.length} {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')}
                    </p>
                </div>

                <ApartmentsList apartments={apartments} />

                <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-muted-foreground max-md:mt-8 max-md:text-sm">
                    <h2 className="mb-4 text-[1.4rem] font-semibold text-foreground">
                        Снять квартиру на сутки {districtIn}
                    </h2>
                    {/* SEO-текст — сборка из частей (каждая часть описана ниже):
                        рукописный блоб первым — уникальное слово Google видит
                        в начале текста, это ценнее; дальше живые данные. */}
                    <p>
                        {blurb && <>{blurb} </>}
                        Квартиры на сутки {districtIn} ({city}) {priceRange} за ночь.
                        {minMetro !== null && (
                            <>
                                {' '}
                                До метро {minMetro} {pluralRu(minMetro, 'минута', 'минуты', 'минут')} пешком.
                            </>
                        )}{' '}
                        Фото, честные цены и онлайн-бронирование напрямую от собственников — без посредников и скрытых
                        комиссий.
                    </p>
                </section>
            </main>
        </>
    );
}
