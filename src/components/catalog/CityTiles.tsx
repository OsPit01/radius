'use client';
import { useState } from 'react';

import { api } from '@/trpc/react';

export function CityTiles() {
    const { data: locations } = api.apartment.getCatalogLocations.useQuery();
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [showAllCities, setShowAllCities] = useState(false);

    if (!locations || locations.length === 0) {
        return null;
    }
    const cities = locations.map((l) => l.city);
    // «Минск» выбран по умолчанию, если он есть — иначе первый город.

    const activeCity = selectedCity ?? (cities.includes('Минск') ? 'Минск' : (cities[0] ?? null));
    const visibleCities = showAllCities ? cities : cities.slice(0, 3);

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
                            //  стиль плитки при фокусе
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
                    >
                        {showAllCities ? 'Скрыть' : 'Показать ещё'}
                    </button>
                )}
            </div>
        </section>
    );
}
