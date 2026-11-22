import Head from 'next/head';
import Link from 'next/link';

import { ApartmentsList } from '@/components/apartments/ApartmentsList';
import { MapPin } from '@/components/icons';
import { Seo } from '@/components/Seo';
import type { ApartmentCardData } from '@/lib/apartment-format';
import { formatByn } from '@/lib/constants/currencies';
import { cityInPrepositional } from '@/lib/declension';
import { pluralRu } from '@/lib/plural';
import { SITE_URL } from '@/lib/seo';
import { transliterate } from '@/lib/transliterate';
import { Layout } from '@/shared/ui/layout';

type CityCatalogPageProps = {
    city: string;
    /** Районы города с активными квартирами — для блока ссылок и перелинковки. */
    microdistricts: string[];
    apartments: ApartmentCardData[];
};

// Городской SEO-блоб: рукописное описание для «главных» городов каталога.
// Формула как у районов: что за место → чем удобно → что можно снять.
// Для городов без блоба абзац начинается сразу с живых данных.
// БЕЗ цен и количества в тексте — они подставятся живыми данными ниже
// (рукописные числа устаревают, живые пересчитываются сами).
const CITY_BLURBS: Record<string, string> = {
    Минск: 'Минск — столица Беларуси: проспект Независимости, Троицкое предместье и Немига в центре, метро по всему городу. Посуточные квартиры рядом с метро и в спальных районах — удобная альтернатива отелю.',
};

/**
 * Страница каталога «Квартиры на сутки в {городе}»: /rent/flat/{слаг-города}.
 * SEO-паттерн тот же, что у страниц районов: blurb + живые данные (цены,
 * типы квартир) + FAQ с микроразметкой FAQPage + ссылки на районы города.
 */
export function CityCatalogPage({ city, microdistricts, apartments }: CityCatalogPageProps) {
    // Предложный падеж: «Минске». Неизвестный словарю город → «городе Минск»
    // (null словаря подменяем безопасной формой через ??).
    const cityIn = cityInPrepositional(city) ?? `городе ${city}`;
    const blurb = CITY_BLURBS[city] ?? null;

    // ===== Живые данные (как на страницах районов — вычисляем, не пишем) =====
    // Самая дешёвая/дорогая квартира: reduce «оставь min/max по цене».
    const cheapest = apartments.reduce((min, a) => (a.price < min.price ? a : min));
    const priciest = apartments.reduce((max, a) => (a.price > max.price ? a : max));
    // Диапазон цен: одна цена → «от 155 Br»; разброс → «от 155 до 350 Br».
    const priceRange =
        cheapest.price === priciest.price
            ? `от ${formatByn(cheapest.price)}`
            : `от ${formatByn(cheapest.price)} до ${formatByn(priciest.price)}`;
    // Типы квартир: rooms каждой квартиры → человекочитаемое название.
    // Set убирает дубли; слова «студии», «однокомнатные» — поисковые запросы.
    const roomTypes = new Set(apartments.map((a) => a.rooms));
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
    const typePhrase = typeWords.length > 0 ? `: ${typeWords.join(', ')}` : '';

    // ===== Тексты FAQ: одна «кухня» на видимый блок и JSON-LD =====
    // (правило Google «размечаем только видимый контент» соблюдено
    // по построению: обе копии берут эти же переменные — разъехаться не могут).
    const faqPriceAnswer = `${priceRange} за ночь${typePhrase}.`;
    const faqDistrictsAnswer =
        microdistricts.length > 0
            ? `Да, выберите район: ${microdistricts.join(', ')}.`
            : 'Пока по районам не делим — все квартиры города показаны на этой странице.';
    const faqBookingAnswer = 'Да: выберите даты в карточке квартиры и отправьте заявку — собственник ответит в чате.';

    return (
        <>
            <Seo
                absoluteTitle={`Квартиры на сутки в ${cityIn} — снять`}
                description={`Снять квартиру на сутки в ${cityIn}${typeWords.length > 0 ? `: ${typeWords.join(', ')}` : ''}. Актуальные фото, цены, бронирование онлайн напрямую от собственников.`}
                canonical={`${SITE_URL}/rent/flat/${transliterate(city)}`}
            />
            {/* FAQPage-разметка (JSON-LD): Google вытаскивает вопросы-ответы
                прямо в сниппет выдачи — раскрывающийся блок под ссылкой =
                больше кликов при той же позиции. Тексты — те же переменные,
                что в видимом FAQ ниже. dangerouslySetInnerHTML безопасен:
                внутри только наши константы (город из справочника, цены-числа). */}
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
                                    name: `Сколько стоит квартира на сутки в ${cityIn}?`,
                                    acceptedAnswer: { '@type': 'Answer', text: faqPriceAnswer },
                                },
                                {
                                    '@type': 'Question',
                                    name: 'Есть ли квартиры по районам?',
                                    acceptedAnswer: { '@type': 'Answer', text: faqDistrictsAnswer },
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
            <Layout withFooter>
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold lg:text-4xl">Квартиры на сутки в {cityIn}</h1>
                    <p className="mt-3 text-base text-muted-foreground">
                        Найдено {apartments.length} {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')}
                    </p>
                </div>

                <ApartmentsList apartments={apartments} />

                {/* ===== Квартиры по районам: перелинковка =====
                    Каждая ссылка ведёт на страницу района (наша НЧ-хвостовая
                    сеть). С городской страницы вес перетекает на районные:
                    районные поднимаются по узким запросам, городская — по
                    широкому «квартира на сутки в минске». */}
                {microdistricts.length > 0 && (
                    <section className="mt-10">
                        <h2 className="mb-4 text-center text-[1.4rem] font-semibold text-foreground max-md:text-[1.2rem]">
                            Квартиры по районам {city}
                        </h2>
                        <div className="flex flex-wrap justify-center gap-3 px-5">
                            {microdistricts.map((name) => (
                                <Link
                                    key={name}
                                    href={`/rent/flat/${transliterate(city)}/microdistrict/${transliterate(name)}`}
                                    className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground no-underline transition-colors duration-200 hover:border-primary"
                                >
                                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                                    {name}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-muted-foreground max-md:mt-8 max-md:text-sm">
                    <h2 className="mb-4 text-[1.4rem] font-semibold text-foreground">
                        Снять квартиру на сутки в {cityIn}
                    </h2>
                    {/* SEO-абзац: городской blurb (если есть) + живые данные.
                        Blurb первым — уникальные слова в начале текста ценнее. */}
                    <p>
                        {blurb && <>{blurb} </>}
                        Квартиры на сутки в {cityIn} {priceRange} за ночь{typePhrase}. Фото, честные цены и
                        онлайн-бронирование напрямую от собственников — без посредников и скрытых комиссий.
                    </p>

                    {/* FAQ: заголовки H3 = реальные поисковые вопросы
                        («сколько стоит квартира на сутки в минске» — точное
                        совпадение). Выравнивание по центру — как у всего
                        SEO-блока страницы: единый визуальный ритм. */}
                    <div className="mt-6 flex flex-col gap-2 text-center">
                        <h3 className="text-base font-semibold text-foreground">
                            Сколько стоит квартира на сутки в {cityIn}?
                        </h3>
                        <p className="text-sm text-muted-foreground">{faqPriceAnswer}</p>
                        <h3 className="mt-2 text-base font-semibold text-foreground">Есть ли квартиры по районам?</h3>
                        <p className="text-sm text-muted-foreground">{faqDistrictsAnswer}</p>
                        <h3 className="mt-2 text-base font-semibold text-foreground">Можно ли забронировать онлайн?</h3>
                        <p className="text-sm text-muted-foreground">{faqBookingAnswer}</p>
                    </div>
                </section>
            </Layout>
        </>
    );
}
