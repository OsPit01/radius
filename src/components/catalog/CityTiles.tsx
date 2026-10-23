'use client';

import 'swiper/css';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { ScanOverlay } from '@/components/home/ScanOverlay';
import { ArrowLeft, MapPin } from '@/components/icons';
import { api } from '@/trpc/react';

/** Минимум, сколько оверлей сканирования остаётся на экране, чтобы анимация была заметна. */
const MIN_SCAN_MS = 1200;

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

export function CityTiles() {
    const { data: locations } = api.apartment.getCatalogLocations.useQuery();

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [showAllCities, setShowAllCities] = useState(false);
    const [showAllMicrodistricts, setShowAllMicrodistricts] = useState(false);
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

    const cities = orderCitiesFromCenter(locations.map((l) => l.city));
    const activeCity = selectedCity ?? (cities.includes('Минск') ? 'Минск' : cities[0]!);
    const visibleCities = showAllCities ? cities : centeredSlice(cities, 3);

    const activeMicrodistricts = locations.find((l) => l.city === activeCity)?.microdistricts ?? [];
    const visibleMicrodistricts = showAllMicrodistricts ? activeMicrodistricts : activeMicrodistricts.slice(0, 4);

    const tileClass =
        'flex w-[230px] flex-col gap-1 rounded-2xl border bg-card px-3 py-3 text-left transition-colors duration-200 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

    const showMoreClass =
        'flex w-[230px] flex-col gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-left transition-colors duration-200 hover:border-primary';

    const cityButton = (city: string) => {
        const isActive = city === activeCity;

        return (
            <button
                onClick={() => {
                    if (isActive) {
                        // город уже выбран — переходим на страницу
                        void router.push(`/rent/flat/${encodeURIComponent(city)}`);
                    } else {
                        // ещё не выбран — выбираем (показываем районы)
                        setSelectedCity(city);
                    }
                }}
                className={`group ${tileClass} ${isActive ? 'border-primary' : 'border-border'}`}
            >
                <span className="flex items-center gap-2">
                    <MapPin className="h-6 w-6 shrink-0 text-primary" />
                    <span className="min-w-0 truncate text-base font-semibold text-foreground">{city}</span>
                    {isActive && (
                        <ArrowLeft className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 ease-out group-hover:-translate-x-1.5" />
                    )}
                </span>

                <span className="block truncate text-sm text-muted-foreground">Квартиры на сутки {city}</span>
            </button>
        );
    };

    const microdistrictLink = (name: string) => (
        <Link
            href={`/rent/flat/${encodeURIComponent(activeCity)}/microdistrict/${encodeURIComponent(name)}`}
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

            {activeMicrodistricts.length > 0 && (
                <>
                    <h2 className="mt-8 text-center text-[1.4rem] font-semibold text-foreground">
                        Районы {activeCity}
                    </h2>
                    <p className="mb-3 text-center text-base text-balance text-muted-foreground max-md:text-sm">
                        Выберите район
                    </p>

                    {activeMicrodistricts.length === 1 ? (
                        <div className="flex justify-center">{microdistrictLink(activeMicrodistricts[0]!)}</div>
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
                            {activeMicrodistricts.length > 4 && (
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
                </>
            )}

            {scanningDistrict && <ScanOverlay district={scanningDistrict} />}
        </section>
    );
}
