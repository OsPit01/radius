"use client";
import { useEffect, useState } from "react";
import { SearchForm } from "@/app/_components/search/SearchForm";
import { ApartmentsList } from "@/app/_components/apartments/ApartmentsList";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/app/_components/ui/LoadingSpinner";
import { Modal } from "@/app/_components/ui/Modal";
import {
  FilterPanel,
  EMPTY_FILTERS,
  type Filters,
} from "@/app/_components/search/FilterPanel";
import { FilterChips, type ChipKey } from "@/app/_components/search/FilterChips";

type Apartment = {
  id: number;
  title: string;
  city: string;
  district: string;
  capacity: number;
  price: number;
  image: string;
  description: string;
  rooms: number;
  metro: string;
  currency: string;
};

export function ClientSearchWrapper() {
  // ===== АКТИВНЫЕ ЗНАЧЕНИЯ (применённые, по ним фильтруется список) =====
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [activeTotalGuests, setActiveTotalGuests] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Filters>(EMPTY_FILTERS);

  // ===== ВРЕМЕННЫЕ ЗНАЧЕНИЯ (пока пользователь не нажал «поиск») =====
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [tempTotalGuests, setTempTotalGuests] = useState(1);
  const [tempFilters, setTempFilters] = useState<Filters>(EMPTY_FILTERS);

  const [isLoading, setIsLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [apartments, setApartments] = useState<Apartment[]>([]);

  const { data: apartmentsData } = api.apartment.getAll.useQuery();

  const shuffleApartments = (list: Apartment[]) => {
    return [...list].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (apartmentsData) {
      const formatted: Apartment[] = apartmentsData.map((item) => ({
        id: item.apartment.id,
        title: item.apartment.title,
        city: item.apartment.city,
        district: item.apartment.district ?? "",
        capacity: item.apartment.capacity,
        price: item.apartment.price,
        image: item.apartment.image,
        description: item.apartment.description ?? "",
        rooms: item.apartment.rooms,
        metro: item.apartment.metro ?? "",
        currency: item.apartment.currency ?? "BYN",
      }));
      setApartments(shuffleApartments(formatted));
    }
  }, [apartmentsData]);

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
  const handleSearch = () => {
    setIsLoading(true);
    setActiveSearchQuery(tempSearchQuery);
    setActiveTotalGuests(tempTotalGuests);
    setActiveFilters(tempFilters);
    setTimeout(() => setIsLoading(false), 500);
  };

  const updateTempQuery = (query: string) => {
    setTempSearchQuery(query);
  };

  const updateTempGuests = (guests: number) => {
    setTempTotalGuests(guests);
  };

  // ===== УБРАТЬ ОДИН ФИЛЬТР (чип) =====
  const removeFilter = (key: ChipKey) => {
    const next: Filters = {
      ...activeFilters,
      [key]: key === "rooms" ? null : "",
    };
    setActiveFilters(next);
    setTempFilters(next);
  };

  // ===== СБРОСИТЬ ВСЕ ФИЛЬТРЫ =====
  const clearFilters = () => {
    setActiveFilters(EMPTY_FILTERS);
    setTempFilters(EMPTY_FILTERS);
  };

  return (
    <>
      <SearchForm
        onSearchClick={handleSearch}
        onTempQueryChange={updateTempQuery}
        onTempGuestsChange={updateTempGuests}
        onFilterClick={() => setMobileFiltersOpen(true)}
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
                className="cursor-pointer text-sm font-medium text-[#b552c7]"
              >
                Сбросить
              </button>
            </div>
            <FilterPanel filters={tempFilters} onChange={setTempFilters} />
            <button
              type="button"
              onClick={handleSearch}
              className="mt-5 w-full cursor-pointer rounded-[30px] bg-[#b552c7] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#9a3fb0]"
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
            handleSearch();
            setMobileFiltersOpen(false);
          }}
          className="mt-6 w-full cursor-pointer rounded-[30px] bg-[#b552c7] px-6 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#9a3fb0]"
        >
          Показать результаты
        </button>
      </Modal>
    </>
  );
}
