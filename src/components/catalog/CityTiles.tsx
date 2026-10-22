'use client';

import { useState } from 'react';

import Link from 'next/link';

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

    return (
        <section>
            <h2 className="text-center text-[1.4rem] font-semibold text-foreground">Города</h2>
            <div className="mt-3 flex flex-wrap justify-center gap-2 px-3">
                {visibleCities.map((city) => {
                    const isActive = city === activeCity;
                    return (
                        <button
                            key={city}
                            type="button"
                            onClick={() => setSelectedCity(city)}
                            className={`cursor-pointer rounded-2xl border bg-card px-5 py-2.5 text-sm font-semibold transition-colors duration-200 hover:border-primary ${
                                isActive ? 'border-primary text-primary' : 'border-border text-foreground'
                            }`}
                        >
                            {city}
                        </button>
                    );
                })}
                {cities.length > 3 && (
                    <button
                        type="button"
                        onClick={() => setShowAllCities((v) => !v)}
                        className="cursor-pointer rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        {showAllCities ? 'Скрыть' : 'Показать ещё'}
                    </button>
                )}
            </div>

            {activeMicrodistricts.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2 px-3">
                    {visibleMicrodistricts.map((name) => (
                        <Link
                            key={name}
                            href={`/rent/flat/${encodeURIComponent(activeCity)}/microdistrict/${encodeURIComponent(name)}`}
                            className="cursor-pointer rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground no-underline transition-colors duration-200 hover:border-primary hover:text-primary"
                        >
                            {name}
                        </Link>
                    ))}
                    {activeMicrodistricts.length > 4 && (
                        <button
                            type="button"
                            onClick={() => setShowAllMicrodistricts((v) => !v)}
                            className="cursor-pointer rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                            {showAllMicrodistricts ? 'Скрыть' : 'Показать ещё'}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
