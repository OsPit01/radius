'use client';

import 'swiper/css';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { ScanOverlay } from '@/components/home/ScanOverlay';
import { ArrowLeft, MapPin } from '@/components/icons';
import { pluralRu } from '@/lib/plural';
import { transliterate } from '@/lib/transliterate';
import { api } from '@/trpc/react';

/** Минимум, сколько оверлей сканирования остаётся на экране, чтобы анимация была заметна. */
const MIN_SCAN_MS = 1200;

// ===== КАК НАЗЫВАТЬ ПЛИТКУ ОБЛАСТИ В ПЕРВОМ РЯДУ =====
// 'center' — названием центpa («Витебск»): привычнее людям, короче на плитке.
// 'region' — названием области («Витебская область»): честнее географически.
// Хочешь сменить подход — поменяй одну строку ниже, остальное подстроится само.
type RegionTileNaming = 'center' | 'region';
const REGION_TILE_NAMING: RegionTileNaming = 'center';

// Сколько районов города показывать сразу (в свайпе). Если районов больше —
// остальные прячутся за кнопкой «Показать ещё». 6 и меньше — видно всё,
// кнопки нет: нечего показывать.
const MICRODISTRICT_VISIBLE_COUNT = 6;

/** Область из getCatalogLocations: без полного справочника — только то, что нужно витрине. */
type CatalogRegion = { value: string; label: string; center: string };
type CatalogLocation = { city: string; microdistricts: string[]; count: number; region: CatalogRegion | null };

/**
 * Расставляет города «от центра»: Минск (или первый город, если Минска нет) в середине,
 * остальные поочерёдно слева и справа — так ряд расширяется от центра наружу.
 */
function orderCitiesFromCenter(cities: string[]): string[] {
    if (cities.length === 0) {
        return [];
    }

    const center = cities.includes('Минск') ? 'Минск' : cities[0]!;
    const rest = cities.filter((c) => c !== center);

    const result = [center];
    rest.forEach((city, i) => {
        if (i % 2 === 0) {
            result.unshift(city);
        } else {
            result.push(city);
        }
    });

    return result;
}

/** Берёт `count` элементов по центру массива — чтобы свёрнутый список тоже шёл «от центра». */
function centeredSlice<T>(arr: T[], count: number): T[] {
    if (arr.length <= count) {
        return arr;
    }
    const center = Math.floor(arr.length / 2);
    const half = Math.floor(count / 2);
    return arr.slice(center - half, center - half + count);
}

/**
 * Навигация каталога на главной — ТРИ уровня, все строго из живых данных:
 *
 * 1. «Города»: Минск (центр ряда) + ПЛИТКИ ОБЛАСТЕЙ, в которых есть активные
 *    квартиры ВНЕ областного центра. Появилась квартира в деревне Витебской
 *    области → в ряду появилась плитка «Витебск» (или «Витебская область» —
 *    зависит от REGION_TILE_NAMING выше). Пока в области есть только сам
 *    центр — плитки нет: она дублировала бы страницу центра.
 *    Город без области (вне справочника) — самостоятельная плитка (страховка).
 * 2. Под выбранной плиткой: микрорайоны (если это город) + «Города и деревни
 *    {области}» — пункты области кроме центра.
 * 3. Клик по пункту → страница этого пункта; клик по плитке области ещё раз →
 *    страница области (все квартиры области).
 *
 * Пустых уровней не бывает: нет квартир — нет плитки, нет страницы.
 */
export function CityTiles() {
    const { data: locations } = api.apartment.getCatalogLocations.useQuery();

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [showAllCities, setShowAllCities] = useState(false);
    const [showAllMicrodistricts, setShowAllMicrodistricts] = useState(false);
    const [showAllLocalities, setShowAllLocalities] = useState(false);
    const [scanningDistrict, setScanningDistrict] = useState<string | null>(null);

    const router = useRouter();
    const scanStartedAtRef = useRef(0);
    const hideTimerRef = useRef<number | null>(null);

    // Оверлей показывается в момент клика, а прячется, когда роутер закончил переход
    // (или упал с ошибкой), но не раньше MIN_SCAN_MS после клика.
    useEffect(() => {
        const finish = () => {
            const rest = Math.max(0, MIN_SCAN_MS - (Date.now() - scanStartedAtRef.current));
            if (hideTimerRef.current !== null) {
                window.clearTimeout(hideTimerRef.current);
            }
            hideTimerRef.current = window.setTimeout(() => {
                setScanningDistrict(null);
                hideTimerRef.current = null;
            }, rest);
        };
        router.events.on('routeChangeComplete', finish);
        router.events.on('routeChangeError', finish);
        return () => {
            router.events.off('routeChangeComplete', finish);
            router.events.off('routeChangeError', finish);
            if (hideTimerRef.current !== null) {
                window.clearTimeout(hideTimerRef.current);
            }
        };
    }, [router.events]);

    const startScan = (name: string) => {
        scanStartedAtRef.current = Date.now();
        setScanningDistrict(name);
    };

    if (!locations || locations.length === 0) {
        return null;
    }

    // ===== Группировка данных =====
    // Пункты каждой области КРОМЕ её центра: такие пункты живут ВНУТРИ области
    // (второй уровень), а не в первом ряду.
    const nonCenterOfRegion = (value: string): CatalogLocation[] =>
        locations.filter((l) => l.region?.value === value && l.city !== l.region?.center);
    // Все области, встречающиеся в данных (с центром или без — не важно:
    // существование области для группировки определяют её нецентровые пункты).
    const regionValues = Array.from(
        new Set(locations.map((l) => l.region?.value).filter((v): v is string => v !== undefined)),
    );
    // «Живая» область = есть нецентровые пункты с квартирами: только тогда
    // показываем группу «города и деревни» и страницу области.
    const liveRegionValues = new Set(regionValues.filter((v) => nonCenterOfRegion(v).length > 0));
    const regionByValue = new Map<string, CatalogRegion>();
    for (const value of regionValues) {
        const region = locations.find((l) => l.region?.value === value)?.region;
        if (region) {
            regionByValue.set(value, region);
        }
    }
    const liveRegions = Array.from(liveRegionValues)
        .map((v) => regionByValue.get(v))
        .filter((r): r is CatalogRegion => r !== undefined);

    // ===== Уровень 1: города с квартирами =====
    // В ряду: сам город (у него свои квартиры), если он НЕ нецентровой пункт
    // области — деревни области показываются внутри её группы, а не здесь.
    // Плюс центры ЖИВЫХ областей, даже если у самого центра нет квартир:
    // по правилу «область появилась ⇔ появился первый объект области» — хоть
    // в центре, хоть в деревне. Плитка называется именем центра либо области.
    const citiesWithFlats = locations
        .filter((l) => l.region === null || l.city === l.region.center)
        .map((l) => {
            if (l.region === null) {
                return l.city;
            }
            const region = regionByValue.get(l.region.value)!;
            return REGION_TILE_NAMING === 'center' ? region.center : region.label;
        });
    const regionOnlyTiles = Array.from(liveRegionValues)
        .map((v) => regionByValue.get(v))
        .filter((r): r is CatalogRegion => r !== undefined)
        // центр уже в списке (есть квартиры) — не дублируем
        .map((r) => (REGION_TILE_NAMING === 'center' ? r.center : r.label))
        .filter((name) => !citiesWithFlats.includes(name));
    const cities = orderCitiesFromCenter(Array.from(new Set([...citiesWithFlats, ...regionOnlyTiles])));

    const activeCity = selectedCity ?? (cities.includes('Минск') ? 'Минск' : cities[0]!);
    const visibleCities = showAllCities ? cities : centeredSlice(cities, 3);

    // Данные выбранной плитки
    const activeRegion = liveRegions.find((r) => (REGION_TILE_NAMING === 'center' ? r.center : r.label) === activeCity);
    const activeEntry = locations.find((l) => l.city === activeCity);
    const regionLocalities = activeRegion ? nonCenterOfRegion(activeRegion.value) : [];
    const regionTotalCount = activeRegion
        ? locations.filter((l) => l.region?.value === activeRegion.value).reduce((sum, l) => sum + l.count, 0)
        : 0;
    const activeMicrodistricts = activeEntry?.microdistricts ?? [];
    // Сколько районов показать: все (после «Показать ещё») или первые 6.
    const visibleMicrodistricts = showAllMicrodistricts
        ? activeMicrodistricts
        : activeMicrodistricts.slice(0, MICRODISTRICT_VISIBLE_COUNT);

    // ===== Уровень 2: микрорайоны + пункты области =====
    const hasSecondLevel = activeMicrodistricts.length > 0 || regionLocalities.length > 0;
    const secondLevelTitle = activeMicrodistricts.length > 0 ? `Районы ${activeCity}` : 'Города и деревни';
    const visibleLocalities = showAllLocalities ? regionLocalities : regionLocalities.slice(0, 6);

    // Клик по плитке уровня 1: первый клик — выбрать (раскрыть уровень 2),
    // второй — перейти: на страницу города, если у него есть квартиры,
    // иначе (центр живой области без своих квартир) — на страницу области.
    const handleCityClick = (city: string) => {
        if (city === activeCity) {
            const hasOwnFlats = locations.some((l) => l.city === city);
            if (!hasOwnFlats && activeRegion) {
                void router.push(`/rent/flat/${activeRegion.value}`);
                return;
            }
            void router.push(
                activeRegion && REGION_TILE_NAMING === 'region'
                    ? `/rent/flat/${activeRegion.value}`
                    : `/rent/flat/${transliterate(city)}`,
            );
        } else {
            setSelectedCity(city);
            setShowAllMicrodistricts(false);
            setShowAllLocalities(false);
        }
    };

    const tileClass =
        'flex w-[230px] flex-col gap-1 rounded-2xl border bg-card px-3 py-3 text-left transition-colors duration-200 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

    const showMoreClass =
        'flex w-[230px] flex-col gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-left transition-colors duration-200 hover:border-primary';

    const cityButton = (city: string) => {
        const isActive = city === activeCity;

        return (
            <button
                onClick={() => handleCityClick(city)}
                className={`group ${tileClass} ${isActive ? 'border-primary' : 'border-border'}`}
            >
                <span className="flex items-center gap-2">
                    <MapPin className="h-6 w-6 shrink-0 text-primary" />
                    <span className="min-w-0 truncate text-base font-semibold text-foreground">{city}</span>
                    {isActive && (
                        <ArrowLeft className="h-5 w-5 shrink-0 animate-[nudgeX_2s_ease-in-out_infinite] text-primary" />
                    )}
                </span>

                <span className="block truncate text-sm text-muted-foreground">Квартиры на сутки {city}</span>
            </button>
        );
    };

    const microdistrictLink = (name: string) => (
        <Link
            href={`/rent/flat/${transliterate(activeCity)}/microdistrict/${transliterate(name)}`}
            className={`${tileClass} border-border no-underline`}
            onClick={(e) => {
                // Сканирование показываем только при обычном клике левой кнопкой:
                // новая вкладка / middle-click / модификаторы не задерживают пользователя оверлеем.
                if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
                    return;
                }
                startScan(name);
            }}
        >
            <span className="flex items-center gap-2">
                <MapPin className="h-6 w-6 shrink-0 text-primary" />
                <span className="min-w-0 truncate text-base font-semibold text-foreground">{name}</span>
            </span>
            <span className="block truncate text-sm text-muted-foreground">Квартиры на сутки {name}</span>
        </Link>
    );

    // Пункт области (уровень 2, вместе с микрорайонами): лист — клик сразу ведёт
    // на страницу этого города/деревни.
    const localityLink = (locality: CatalogLocation) => (
        <Link
            href={`/rent/flat/${transliterate(locality.city)}`}
            className={`${tileClass} border-border no-underline`}
            onClick={(e) => {
                if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
                    return;
                }
                startScan(locality.city);
            }}
        >
            <span className="flex items-center gap-2">
                <MapPin className="h-6 w-6 shrink-0 text-primary" />
                <span className="min-w-0 truncate text-base font-semibold text-foreground">{locality.city}</span>
            </span>
            <span className="block truncate text-sm text-muted-foreground">
                {locality.count} {pluralRu(locality.count, 'квартира', 'квартиры', 'квартир')}
            </span>
        </Link>
    );

    // Плитка «все квартиры области» (уровень 2, справа от микрорайонов):
    // показывается только когда у области есть нецентровые пункты.
    const regionAllTile = activeRegion ? (
        <button
            onClick={() => void router.push(`/rent/flat/${activeRegion.value}`)}
            className={`${tileClass} border-border`}
        >
            <span className="flex items-center gap-2">
                <MapPin className="h-6 w-6 shrink-0 text-primary" />
                <span className="min-w-0 truncate text-base font-semibold text-foreground">
                    Вся {activeRegion.label}
                </span>
            </span>
            <span className="block truncate text-sm text-muted-foreground">
                {regionTotalCount} {pluralRu(regionTotalCount, 'квартира', 'квартиры', 'квартир')} · все города и
                деревни
            </span>
        </button>
    ) : null;

    return (
        <section>
            <h2 className="text-center text-[1.4rem] font-semibold text-foreground">Города</h2>
            <p className="mb-3 text-center text-base text-balance text-muted-foreground max-md:text-sm">
                Выберите город
            </p>

            {cities.length === 1 ? (
                <div className="flex justify-center">{cityButton(cities[0]!)}</div>
            ) : (
                <div className="flex flex-wrap justify-center gap-3 px-5">
                    {visibleCities.map((city) => (
                        <div key={city}>{cityButton(city)}</div>
                    ))}
                    {cities.length > 3 && (
                        <button
                            type="button"
                            onClick={() => setShowAllCities((v) => !v)}
                            className={showMoreClass}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-base font-semibold text-muted-foreground">
                                    {showAllCities ? 'Скрыть' : 'Показать ещё'}
                                </span>
                            </span>
                        </button>
                    )}
                </div>
            )}

            {/* ===== Уровень 2: районы центра + города и деревни области ===== */}
            {hasSecondLevel && (
                <>
                    <h2 className="mt-8 text-center text-[1.4rem] font-semibold text-foreground">{secondLevelTitle}</h2>
                    <p className="mb-3 text-center text-base text-balance text-muted-foreground max-md:text-sm">
                        Выберите район
                    </p>

                    {activeMicrodistricts.length + (regionAllTile ? 1 : 0) <= 1 ? (
                        <div className="flex justify-center">
                            {regionAllTile ?? microdistrictLink(activeMicrodistricts[0]!)}
                        </div>
                    ) : (
                        <Swiper
                            modules={[FreeMode]}
                            slidesPerView="auto"
                            spaceBetween={12}
                            freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
                            className="!px-5"
                        >
                            {visibleMicrodistricts.map((name) => (
                                <SwiperSlide
                                    key={name}
                                    className="!w-[230px]"
                                >
                                    {microdistrictLink(name)}
                                </SwiperSlide>
                            ))}
                            {regionAllTile && <SwiperSlide className="!w-[230px]">{regionAllTile}</SwiperSlide>}
                            {/* «Показать ещё» существует ТОЛЬКО когда реально что-то скрыто:
                                показываем первые 6 районов, кнопка — если их больше. При 6 и меньше
                                всё видно целиком и кнопки нет (показывать нечего). */}
                            {activeMicrodistricts.length > MICRODISTRICT_VISIBLE_COUNT && (
                                <SwiperSlide className="!w-[230px]">
                                    <button
                                        type="button"
                                        onClick={() => setShowAllMicrodistricts((v) => !v)}
                                        className={showMoreClass}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="text-base font-semibold text-muted-foreground">
                                                {showAllMicrodistricts ? 'Скрыть' : 'Показать ещё'}
                                            </span>
                                        </span>
                                    </button>
                                </SwiperSlide>
                            )}
                        </Swiper>
                    )}

                    {/* Города и деревни области — плитками, не свайпом: их немного,
                        а сетка читается и на мобилке без горизонтального скролла. */}
                    {regionLocalities.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-3 px-5">
                            {visibleLocalities.map((locality) => (
                                <div key={locality.city}>{localityLink(locality)}</div>
                            ))}
                            {regionLocalities.length > 6 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllLocalities((v) => !v)}
                                    className={showMoreClass}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-base font-semibold text-muted-foreground">
                                            {showAllLocalities ? 'Скрыть' : 'Показать ещё'}
                                        </span>
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {scanningDistrict && <ScanOverlay district={scanningDistrict} />}
        </section>
    );
}
