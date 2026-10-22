'use client';

import { useState } from 'react';

import Link from 'next/link';

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

    const scrollRow =
        'mx-auto flex w-fit max-w-full snap-x  gap-3 overflow-x-auto pb-1 max-md:-mx-5 max-md:w-auto max-md:max-w-none max-md:scroll-px-5 max-md:px-5';

    return (
        <section>
            <h2 className="text-center text-[1.4rem] font-semibold text-foreground">Города</h2>
            <p className="mb-3 text-center text-base text-balance text-muted-foreground max-md:text-sm">
                Выберите город
            </p>

            <ul className={scrollRow}>
                {visibleCities.map((city) => {
                    const isActive = city === activeCity;
                    return (
                        <li
                            key={city}
                            className="flex shrink-0 snap-start"
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedCity(city)}
                                className={`flex w-[230px] flex-col gap-1 rounded-2xl border bg-card px-3 py-3 text-left transition-colors duration-200 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                    isActive ? 'border-primary' : 'border-border'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-6 w-6 shrink-0 text-primary" />
                                    <span className="text-base font-semibold text-foreground">{city}</span>
                                </span>
                                <span className="block text-sm text-balance text-muted-foreground">
                                    Квартиры на сутки в {city}
                                </span>
                            </button>
                        </li>
                    );
                })}
                {cities.length > 3 && (
                    <li className="flex shrink-0 snap-start">
                        <button
                            type="button"
                            onClick={() => setShowAllCities((v) => !v)}
                            className="flex w-[230px] flex-col gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-left transition-colors duration-200 hover:border-primary"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-base font-semibold text-muted-foreground">
                                    {showAllCities ? 'Скрыть' : 'Показать ещё'}
                                </span>
                            </span>
                        </button>
                    </li>
                )}
            </ul>

            {activeMicrodistricts.length > 0 && (
                <>
                    <h2 className="mt-8 text-center text-[1.4rem] font-semibold text-foreground">
                        Районы {activeCity}
                    </h2>
                    <p className="mb-3 text-center text-base text-balance text-muted-foreground max-md:text-sm">
                        Выберите район
                    </p>

                    <ul className={scrollRow}>
                        {visibleMicrodistricts.map((name) => (
                            <li
                                key={name}
                                className="flex shrink-0 snap-start"
                            >
                                <Link
                                    href={`/rent/flat/${encodeURIComponent(activeCity)}/microdistrict/${encodeURIComponent(name)}`}
                                    className="flex w-[230px] flex-col gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-left no-underline transition-colors duration-200 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <MapPin className="h-6 w-6 shrink-0 text-primary" />
                                        <span className="text-base font-semibold text-foreground">{name}</span>
                                    </span>
                                    <span className="block text-sm text-balance text-muted-foreground">
                                        Квартиры на сутки в {name}
                                    </span>
                                </Link>
                            </li>
                        ))}
                        {activeMicrodistricts.length > 4 && (
                            <li className="flex shrink-0 snap-start">
                                <button
                                    type="button"
                                    onClick={() => setShowAllMicrodistricts((v) => !v)}
                                    className="flex w-[230px] flex-col gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-left transition-colors duration-200 hover:border-primary"
                                >
                                    <span className="text-base font-semibold text-muted-foreground">
                                        {showAllMicrodistricts ? 'Скрыть' : 'Показать ещё'}
                                    </span>
                                </button>
                            </li>
                        )}
                    </ul>
                </>
            )}
        </section>
    );
}
