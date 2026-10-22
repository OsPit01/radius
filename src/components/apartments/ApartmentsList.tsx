import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import { ChevronLeft, ChevronRight } from '@/components/icons';
import type { ApartmentCardData } from '@/lib/apartment-format';
import { api } from '@/trpc/react';

import type { Filters } from '../search/FilterPanel';
import { ApartmentCard } from './ApartmentCard';
const APARTMENTS_PAGE_SIZE = 12;

type ApartmentsListProps = {
    apartments: ApartmentCardData[];
    searchQuery?: string;
    totalGuests?: number;
    totalChildren?: number;
    filters?: Filters;
};

export function ApartmentsList({
    apartments,
    searchQuery = '',
    totalGuests = 1,
    totalChildren = 0,
    filters,
}: ApartmentsListProps) {
    const { data: session } = useSession();
    const { data: favIds } = api.favorites.listIds.useQuery(undefined, {
        enabled: !!session?.user,
    });

    // ===== ФИЛЬТРАЦИЯ =====
    const filteredApartments = apartments.filter((apartment) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            q === '' ||
            apartment.city.toLowerCase().includes(q) ||
            apartment.street.toLowerCase().includes(q) ||
            apartment.microdistrict.toLowerCase().includes(q);

        const matchesCapacity = apartment.capacity >= totalGuests;

        const matchesPriceMin = !filters?.priceMin || apartment.price >= Number(filters.priceMin);
        const matchesPriceMax = !filters?.priceMax || apartment.price <= Number(filters.priceMax);
        const matchesRooms =
            filters?.rooms == null || (filters.rooms === 4 ? apartment.rooms >= 4 : apartment.rooms === filters.rooms);

        const totalBeds = (apartment.beds ?? 0) + (apartment.singleBeds ?? 0);
        const matchesBeds = filters?.beds == null || totalBeds >= filters.beds;

        const totalSofas = (apartment.doubleSofas ?? 0) + (apartment.singleSofas ?? 0);
        const matchesSofas = filters?.sofas == null || totalSofas >= filters.sofas;

        const matchesMetro =
            filters?.metro == null || (apartment.metro !== '' && Number(apartment.metro) <= filters.metro);

        return (
            matchesSearch &&
            matchesCapacity &&
            matchesPriceMin &&
            matchesPriceMax &&
            matchesRooms &&
            matchesBeds &&
            matchesSofas &&
            matchesMetro
        );
    });
    const foundCount = filteredApartments.length;

    const totalPages = Math.ceil(filteredApartments.length / APARTMENTS_PAGE_SIZE);
    //Состояние страниц
    const [currentPage, setCurrentPage] = useState(1);

    const visibleApartments = filteredApartments.slice(
        (currentPage - 1) * APARTMENTS_PAGE_SIZE,
        currentPage * APARTMENTS_PAGE_SIZE,
    );
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, totalGuests, filters]);

    if (foundCount === 0) {
        return (
            <div className="my-[50px] w-full">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Варианты для проживания: 0</h2>
                <div className="p-[60px_20px] text-center">
                    <p className="text-xl font-semibold text-foreground">Ничего не найдено!</p>
                    <p className="text-base text-muted-foreground">Попробуйте изменить параметры поиска</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-[50px] w-full">
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
                Варианты для проживания: {foundCount}
                {searchQuery && <p className="text-lg font-semibold">Город: {searchQuery}</p>}
                {totalGuests > 1 && <p className="text-base font-normal">Количество человек: {totalGuests}</p>}
            </h2>

            <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-[50px] px-5 max-md:grid-cols-1 max-md:gap-5 max-md:px-4">
                {visibleApartments.map((apartment) => (
                    <ApartmentCard
                        key={apartment.id}
                        apartment={apartment}
                        isFavorite={favIds?.includes(apartment.id) ?? false}
                        guests={totalGuests}
                        childrenCount={totalChildren}
                    />
                ))}
            </div>
            <div className="mt-10 flex items-center justify-center gap-4">
                <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                <div>
                    {getPageItems(currentPage, totalPages).map((item, index) =>
                        typeof item === 'number' ? (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setCurrentPage(item)}
                                className={`ml-1 h-8 w-8 rounded-full transition-colors ${item === currentPage ? 'bg-foreground text-background' : 'bg-muted text-foreground hover:bg-border'}`}
                            >
                                {item}
                            </button>
                        ) : (
                            <span key={`dots-${index}`}>...</span>
                        ),
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
function getPageItems(currentPage: number, totalPages: number): (number | string)[] {
    const items: (number | string)[] = [];
    items.push(1);

    // СЛУЧАЙ 1 — страниц мало, показываем всё
    if (totalPages < 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // 2. многоточие слева (условие!)
    if (currentPage - 1 > 2) {
        items.push('...');
    }
    // 3. соседи ( цикл, но с защитой границ)
    for (let page = currentPage - 1; page <= currentPage + 1; page++) {
        if (page > 1 && page < totalPages) {
            items.push(page);
        }
    }

    // 5. последняя страница (только если больше 1)
    if (totalPages > 1) {
        items.push(totalPages);
    }
    return items;
}
