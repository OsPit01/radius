import Link from 'next/link';

import { ApartmentsList } from '@/components/apartments/ApartmentsList';
import { MapPin } from '@/components/icons';
import { Seo } from '@/components/Seo';
import type { ApartmentCardData } from '@/lib/apartment-format';
import { formatByn } from '@/lib/constants/currencies';
import { regionInPrepositional } from '@/lib/declension';
import { pluralRu } from '@/lib/plural';
import { SITE_URL } from '@/lib/seo';
import { transliterate } from '@/lib/transliterate';
import { Layout } from '@/shared/ui/layout';

type RegionCatalogPageProps = {
    regionValue: string; // 'vitebsk-region' — слаг, он же адрес страницы
    regionLabel: string; // «Витебская область» — для заголовков
    // Населённые пункты области с активными квартирами (центр уже исключён —
    // он живёт в первом ряду навигации главной).
    localities: { city: string; count: number }[];
    apartments: ApartmentCardData[];
};

/**
 * Страница каталога «Квартиры на сутки в {области}»: /rent/flat/{region}-region.
 * Список квартир области + навигация по её городам и деревням.
 */
export function RegionCatalogPage({ regionValue, regionLabel, localities, apartments }: RegionCatalogPageProps) {
    const regionIn = regionInPrepositional(regionLabel);
    const cheapest = apartments.reduce((min, a) => (a.price < min.price ? a : min));
    // Список пунктов для SEO-текста: «Замосточье, Витебск и …»
    const localityNames = localities.map((l) => l.city);

    return (
        <>
            <Seo
                absoluteTitle={`Квартиры на сутки в ${regionIn} — снять`}
                description={`Снять квартиру на сутки в ${regionIn}: ${localityNames.join(', ')}. Актуальные фото, цены, бронирование онлайн напрямую от собственников.`}
                canonical={`${SITE_URL}/rent/flat/${regionValue}`}
            />
            <Layout withFooter>
                <div className="mb-6 px-4 text-center">
                    <h1 className="px-4 text-2xl font-bold md:text-3xl">Квартиры на сутки в {regionIn}</h1>
                    <p className="mt-3 text-base text-muted-foreground md:text-lg">
                        Найдено {apartments.length} {pluralRu(apartments.length, 'квартира', 'квартиры', 'квартир')}
                    </p>
                </div>

                {/* Навигация по области: каждый пункт ведёт на свою страницу города/деревни.
                    Внутренние ссылки + названия в тексте — хорошо для SEO (релевантность
                    страницы по запросам «квартиры в {пункт}»). */}
                <section className="mb-10">
                    <h2 className="mb-4 text-center text-[1.4rem] font-semibold text-foreground max-md:text-[1.2rem]">
                        Города и деревни
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3 px-5">
                        {localities.map((l) => (
                            <Link
                                key={l.city}
                                href={`/rent/flat/${transliterate(l.city)}`}
                                className="flex min-w-[180px] flex-col gap-1 rounded-2xl border border-border bg-card px-4 py-3 no-underline transition-colors duration-200 hover:border-primary"
                            >
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                                    <span className="min-w-0 truncate text-base font-semibold text-foreground">
                                        {l.city}
                                    </span>
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {l.count} {pluralRu(l.count, 'квартира', 'квартиры', 'квартир')}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <ApartmentsList apartments={apartments} />

                <section className="mx-auto mt-12 max-w-3xl text-center text-base text-muted-foreground md:mt-8">
                    <h2 className="mb-4 px-4 text-lg font-semibold text-foreground">
                        Снять квартиру на сутки в {regionIn}
                    </h2>
                    <p className="px-4">
                        Квартиры на сутки в {regionIn} от {formatByn(cheapest.price)} за ночь:{' '}
                        {localityNames.join(', ')}. Фото, честные цены и онлайн-бронирование напрямую от собственников —
                        без посредников и скрытых комиссий.
                    </p>
                </section>
            </Layout>
        </>
    );
}
