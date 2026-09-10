"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchForm } from "@/app/_components/search/SearchForm";
import { ApartmentsList } from "@/app/_components/apartments/ApartmentsList";
import { LoadingSpinner } from "@/app/_components/ui/LoadingSpinner";
import { Modal } from "@/app/_components/ui/Modal";
import {
  FilterPanel,
  EMPTY_FILTERS,
  type Filters,
} from "@/app/_components/search/FilterPanel";
import { FilterChips, type ChipKey } from "@/app/_components/search/FilterChips";
import type { ApartmentCardData } from "@/lib/apartment-format";
import { buildSearchUrl, type SearchFilters } from "@/lib/search-params";

type ClientSearchWrapperProps = {
  initialFilters: SearchFilters;
  initialApartments: ApartmentCardData[];
};

// Преобразование SearchFilters (из URL) → Filters (для UI-панели)
function toUiFilters(initial: SearchFilters): Filters {
  return {
    priceMin: initial.priceMin != null ? String(initial.priceMin) : "",
    priceMax: initial.priceMax != null ? String(initial.priceMax) : "",
    rooms: initial.rooms ?? null,
    beds: initial.beds ?? null,
    sofas: initial.sofas ?? null,
  };
}

export function ClientSearchWrapper({
  initialFilters,
  initialApartments,
}: ClientSearchWrapperProps) {
  const router = useRouter();

  // ===== АКТИВНЫЕ ЗНАЧЕНИЯ (пришли с сервера через URL) =====
  const [activeSearchQuery, setActiveSearchQuery] = useState(
    initialFilters.city ?? "",
  );
  const [activeTotalGuests, setActiveTotalGuests] = useState(
    initialFilters.guests ?? 1,
  );
  const [activeFilters, setActiveFilters] = useState<Filters>(
    toUiFilters(initialFilters),
  );

  // ===== ВРЕМЕННЫЕ ЗНАЧЕНИЯ (пока пользователь не нажал «поиск») =====
  const [tempFilters, setTempFilters] = useState<Filters>(
    toUiFilters(initialFilters),
  );

  const [isLoading, setIsLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [apartments, setApartments] = useState<ApartmentCardData[]>(
    initialApartments,
  );

  const shuffleApartments = (list: ApartmentCardData[]) => {
    return [...list].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    setApartments(shuffleApartments(initialApartments));
  }, [initialApartments]);

  useEffect(() => {
    if (apartments.length === 0) return;
    const interval = setInterval(() => {
      setApartments((prev) => shuffleApartments(prev));
    }, 900000);
    return () => clearInterval(interval);
  }, [apartments.length]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && apartments.length > 0) {
        setApartments((prev) => shuffleApartments(prev));
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [apartments.length]);

  // ===== ПРИМЕНИТЬ ВСЕ ФИЛЬТРЫ (поиск + гости + цена/комнаты) =====
  const handleSearch = (query: string, guests: number) => {
    setIsLoading(true);
    setActiveSearchQuery(query);
    setActiveTotalGuests(guests);
    setActiveFilters(tempFilters);
    const urlFilters: SearchFilters = {
      city: query.trim() || undefined,
      guests: guests > 1 ? guests : undefined,
      priceMin: tempFilters.priceMin ? Number(tempFilters.priceMin) : undefined,
      priceMax: tempFilters.priceMax ? Number(tempFilters.priceMax) : undefined,
      rooms: tempFilters.rooms ?? undefined,
      beds: tempFilters.beds ?? undefined,
      sofas: tempFilters.sofas ?? undefined,
    };
    router.replace(buildSearchUrl(urlFilters), { scroll: false });
    setTimeout(() => setIsLoading(false), 300);
  };

  const updateTempQuery = (query: string) => {
    // текст поиска хранится в SearchForm'е; синхронизируем при поиске
    setActiveSearchQuery(query);
  };

  // ===== УБРАТЬ ОДИН ФИЛЬТР (чип) =====
  const removeFilter = (key: ChipKey) => {
    const isCountFilter = key === "rooms" || key === "beds" || key === "sofas";
    const next: Filters = {
      ...activeFilters,
      [key]: isCountFilter ? null : "",
    };
    setActiveFilters(next);
    setTempFilters(next);
    const urlFilters: SearchFilters = {
      city: activeSearchQuery.trim() || undefined,
      guests: activeTotalGuests > 1 ? activeTotalGuests : undefined,
      priceMin: next.priceMin ? Number(next.priceMin) : undefined,
      priceMax: next.priceMax ? Number(next.priceMax) : undefined,
      rooms: next.rooms ?? undefined,
      beds: next.beds ?? undefined,
      sofas: next.sofas ?? undefined,
    };
    router.replace(buildSearchUrl(urlFilters), { scroll: false });
  };

  // ===== СБРОСИТЬ ВСЕ ФИЛЬТРЫ =====
  const clearFilters = () => {
    setActiveFilters(EMPTY_FILTERS);
    setTempFilters(EMPTY_FILTERS);
    setActiveSearchQuery("");
    router.replace(buildSearchUrl({}), { scroll: false });
  };

  return (
    <>
      <SearchForm
        onSearchClick={(query, guests) => handleSearch(query, guests)}
        onTempQueryChange={updateTempQuery}
        onTempGuestsChange={(guests) => setActiveTotalGuests(guests)}
        onFilterClick={() => setMobileFiltersOpen(true)}
        initialQuery={activeSearchQuery}
        initialGuests={activeTotalGuests}
        isLoading={isLoading}
      />

      <FilterChips
        filters={activeFilters}
        onRemove={removeFilter}
        onClear={clearFilters}
      />

      <div className="mx-auto mt-6 flex w-full max-w-[1400px] gap-8 px-5 max-md:px-4">
        {/* ===== САЙДБАР ФИЛЬТРОВ (десктоп/планшет) ===== */}
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-[#222]">Фильтры</p>
              <button
                type="button"
                onClick={() => setTempFilters(EMPTY_FILTERS)}
                className="cursor-pointer text-sm font-medium text-[#6b21a8]"
              >
                Сбросить
              </button>
            </div>
            <FilterPanel filters={tempFilters} onChange={setTempFilters} />
            <button
              type="button"
              onClick={() => handleSearch(activeSearchQuery, activeTotalGuests)}
              className="mt-5 w-full cursor-pointer rounded-[30px] bg-[#6b21a8] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#581c87]"
            >
              Показать объекты
            </button>
          </div>
        </aside>

        {/* ===== СПИСОК КВАРТИР ===== */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <LoadingSpinner label="Поиск..." />
          ) : (
            <ApartmentsList
              apartments={apartments}
              searchQuery={activeSearchQuery}
              totalGuests={activeTotalGuests}
              filters={activeFilters}
            />
          )}
        </div>
      </div>

      {/* ===== МОБИЛЬНЫЙ ПОПАП ФИЛЬТРОВ ===== */}
      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Фильтры"
      >
        <FilterPanel filters={tempFilters} onChange={setTempFilters} />
        <button
          type="button"
          onClick={() => {
            handleSearch(activeSearchQuery, activeTotalGuests);
            setMobileFiltersOpen(false);
          }}
          className="mt-6 w-full cursor-pointer rounded-[30px] bg-[#6b21a8] px-6 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#581c87]"
        >
          Показать результаты
        </button>
      </Modal>
    </>
  );
}