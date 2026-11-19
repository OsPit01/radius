import type { GetServerSideProps } from 'next';
import Head from 'next/head';

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
    // «Веснянка» и «Юго-Запад» — районы, что индексировались в октябре
    // (тогда их вводили руками), а теперь их нет ни в справочнике, ни у
    // активных квартир. Google успел их увидеть (GSC: «страница с
    // переадресацией»/404) → 301 на Минск, чтобы вес не умер на 404.
    vesnyanka: 'minsk',
    'yugo-zapad': 'minsk',
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
    // Object.hasOwn — ищем только СОБСТВЕННЫЙ ключ карты: слаг вроде
    // 'constructor' без проверки нашёл бы унаследованный конструктор из
    // Object.prototype (truthy-мусор) и отправил «редирект» в никуда.
    const aliasKey = `${citySlug}/${nameSlug}`;
    const aliased = Object.hasOwn(MICRODISTRICT_SLUG_ALIASES, aliasKey)
        ? MICRODISTRICT_SLUG_ALIASES[aliasKey]
        : undefined;
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
    const retiredCity = Object.hasOwn(RETIRED_MICRODISTRICT_SLUGS, nameSlug)
        ? RETIRED_MICRODISTRICT_SLUGS[nameSlug]
        : undefined;
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
        // Город каталогу неизвестен. ДО того как отдать 404, пробуем спасти
        // посетителя и SEO-вес со старой ссылки: префикс города мог быть
        // мусором из БД прошлых лет («Минская область» вместо города,
        // «Копище» до склейки с Минском) — такие URL успели попасть в индекс,
        // а сам район теперь живёт под каноническим городом.
        // Ищем во ВСЕМ каталоге города, у которых есть район с этим слагом.
        const districtOwners = locations.filter((l) => l.microdistricts.some((m) => transliterate(m) === nameSlug));
        // Редиректим, только если владелец района РОВНО ОДИН: при неоднозначности
        // (два города с одноимённым районом) угадывать нельзя — честный 404.
        // Деструктуризация + проверка на undefined — требование строгого
        // noUncheckedIndexedAccess (элемент массива «может отсутствовать»).
        const [owner] = districtOwners;
        if (districtOwners.length === 1 && owner) {
            return {
                redirect: {
                    // nameSlug уже нормализован (транслит проверен выше),
                    // transliterate(owner.city) — канонический слаг города:
                    // редирект ведёт напрямую на живую страницу, без цепочек.
                    destination: `/rent/flat/${transliterate(owner.city)}/microdistrict/${nameSlug}`,
                    permanent: true,
                },
            };
        }
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

    // ===== Типы квартир района — тоже вычисляем из данных, не пишем руками =====
    // rooms каждой квартиры → человекочитаемый тип. Слова «студии», «однокомнатные»,
    // «двухкомнатные» — это буквально поисковые запросы («студия на сутки в уручье»),
    // их наличие в тексте делает страницу релевантнее по этим запросам.
    // Set убирает дубли: три 1-комнатные квартиры → один тип.
    const roomTypes = new Set(apartments.map((a) => a.rooms));
    // Словарь «комнат → название»: 1 комната = и студия, и однокомнатная —
    // владельцы называют по-разному, пишем обе формы. 4+ — числом.
    const typeWords = Array.from(roomTypes)
        .flatMap((rooms) =>
            rooms === 1
                ? ['студии и однокомнатные']
                : rooms === 2
                  ? ['двухкомнатные']
                  : rooms === 3
                    ? ['трехкомнатные']
                    : [`${rooms}-комнатные`],
        )
        .sort(); // стабильный порядок: текст одинаков при каждой загрузке
    // Фраза для абзаца: пусто (нет квартир) → не пишем вовсе.
    const typePhrase = typeWords.length > 0 ? `: ${typeWords.join(', ')}` : '';

    // ===== Тексты FAQ: собираем ОДИН раз — и для видимого блока, и для =====
    // ===== микроразметки ниже. Правило Google: размечаем только видимый  =====
    // ===== контент, тексты обязаны совпадать. Одна переменная = совпадение  =====
    // ===== физически гарантировано (разъехаться не могут).
    const faqPriceAnswer = `${priceRange} за ночь${typePhrase}.`;
    const faqMetroAnswer =
        minMetro !== null
            ? `До ближайшей станции ${minMetro} ${pluralRu(minMetro, 'минута', 'минуты', 'минут')} пешком.`
            : 'Район вдали от метро — удобнее добираться на машине или общественном транспорте.';
    const faqBookingAnswer = 'Да: выберите даты в карточке квартиры и отправьте заявку — собственник ответит в чате.';

    return (
        <>
            <Seo
                absoluteTitle={`Квартиры на сутки ${districtIn} — ${city}`}
                description={`Снять квартиру на сутки ${districtIn} (${city}). Актуальные фото, цены, бронирование онлайн напрямую от собственников.`}
                canonical={`${SITE_URL}/rent/flat/${transliterate(city)}/microdistrict/${transliterate(name)}`}
            />
            {/* FAQPage-разметка (JSON-LD): Google вытаскивает вопросы-ответы
                прямо в сниппет выдачи — раскрывающийся блок под ссылкой =
                больше кликов при той же позиции. Тексты — те же переменные,
                что в видимом FAQ ниже (faqPriceAnswer и др.): правило Google
                «размечаем только видимый контент» соблюдено автоматически.
                dangerouslySetInnerHTML безопасен: всё внутри — наши константы,
                пользовательских строк нет (район — из справочника, цены — числа). */}
            <Head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'FAQPage',
                            mainEntity: [
                                {
                                    '@type': 'Question',
                                    name: `Сколько стоит квартира на сутки ${districtIn}?`,
                                    acceptedAnswer: { '@type': 'Answer', text: faqPriceAnswer },
                                },
                                {
                                    '@type': 'Question',
                                    name: 'Как добраться до метро?',
                                    acceptedAnswer: { '@type': 'Answer', text: faqMetroAnswer },
                                },
                                {
                                    '@type': 'Question',
                                    name: 'Можно ли забронировать онлайн?',
                                    acceptedAnswer: { '@type': 'Answer', text: faqBookingAnswer },
                                },
                            ],
                        }),
                    }}
                />
            </Head>
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
                        Квартиры на сутки {districtIn} ({city}) {priceRange} за ночь{typePhrase}.
                        {minMetro !== null && (
                            <>
                                {' '}
                                До метро {minMetro} {pluralRu(minMetro, 'минута', 'минуты', 'минут')} пешком.
                            </>
                        )}{' '}
                        Фото, честные цены и онлайн-бронирование напрямую от собственников — без посредников и скрытых
                        комиссий.
                    </p>

                    {/* FAQ: заголовки H3 = реальные поисковые запросы (голосовые и
                        длинные: «сколько стоит квартира на сутки в уручье» находят
                        точное совпадение). Ответы — те же переменные, что в JSON-LD
                        выше: тексты размеченного и видимого совпадают по построению.
                        Выравнивание по центру — как у всего SEO-блока страницы. */}
                    <div className="mt-6 flex flex-col gap-2 text-center">
                        <h3 className="text-base font-semibold text-foreground">
                            Сколько стоит квартира на сутки {districtIn}?
                        </h3>
                        <p className="text-sm text-muted-foreground">{faqPriceAnswer}</p>
                        <h3 className="mt-2 text-base font-semibold text-foreground">Как добраться до метро?</h3>
                        <p className="text-sm text-muted-foreground">{faqMetroAnswer}</p>
                        <h3 className="mt-2 text-base font-semibold text-foreground">Можно ли забронировать онлайн?</h3>
                        <p className="text-sm text-muted-foreground">{faqBookingAnswer}</p>
                    </div>
                </section>
            </main>
        </>
    );
}
