'use client';

import 'swiper/css';

import { useState } from 'react';

import Link from 'next/link';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { MapPin } from '@/components/icons';
import { api } from '@/trpc/react';

export function CityTiles() {
    const { data: locations } = api.apartment.getCatalogLocations.useQuery();

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [showAllCities, setShowAllCities] = useState(false);
    const [showAllMicrodistricts, setShowAllMicrodistricts] = useState(false);

    if (!locations || locations.length === 0) {
        return null;
    }

    const cities = locations.map((l) => l.city);
    const activeCity = selectedCity ?? (cities.includes('Минск') ? 'Минск' : cities[0]!);
    const visibleCities = showAllCities ? cities : cities.slice(0, 3);

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
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`${tileClass} ${isActive ? 'border-primary' : 'border-border'}`}
            >
                <span className="flex items-center gap-2">
                    <MapPin className="h-6 w-6 shrink-0 text-primary" />
                    <span className="min-w-0 truncate text-base font-semibold text-foreground">{city}</span>
                </span>
                <span className="block truncate text-sm text-muted-foreground">Квартиры на сутки {city}</span>
            </button>
        );
    };

    const microdistrictLink = (name: string) => (
        <Link
            href={`/rent/flat/${encodeURIComponent(activeCity)}/microdistrict/${encodeURIComponent(name)}`}
            className={`${tileClass} border-border no-underline`}
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
                <Swiper
                    modules={[FreeMode]}
                    slidesPerView="auto"
                    spaceBetween={12}
                    freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
                    className="!px-5"
                >
                    {visibleCities.map((city) => (
                        <SwiperSlide
                            key={city}
                            className="!w-[230px]"
                        >
                            {cityButton(city)}
                        </SwiperSlide>
                    ))}
                    {cities.length > 3 && (
                        <SwiperSlide className="!w-[230px]">
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
                        </SwiperSlide>
                    )}
                </Swiper>
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
        </section>
    );
}
