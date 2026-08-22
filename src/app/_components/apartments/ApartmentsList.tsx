"use client";
import { useSession } from "next-auth/react";
import { ApartmentCard } from "./ApartmentCard";
import { api } from "@/trpc/react";

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

type ApartmentsListProps = {
  apartments: Apartment[]; // ← ЭТО ДОЛЖНО БЫТЬ!
  searchQuery?: string;
  totalGuests?: number;
};

export function ApartmentsList({
  apartments,
  searchQuery = "",
  totalGuests = 1,
}: ApartmentsListProps) {
  const { data: session } = useSession();
  const { data: favIds } = api.favorites.listIds.useQuery(undefined, {
    enabled: !!session?.user,
  });
  // ===== ФИЛЬТРАЦИЯ =====
  const filteredApartments = apartments.filter((apartment) => {
    const matchesSearch =
      searchQuery === "" ||
      apartment.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apartment.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCapacity = apartment.capacity >= totalGuests;

    return matchesSearch && matchesCapacity;
  });

  const foundCount = filteredApartments.length;

  if (foundCount === 0) {
    return (
      <div className="my-[50px] w-full">
        <h2 className="mb-10 text-center text-2xl font-bold text-[#333]">
          Варианты для проживания: 0
        </h2>
        <div className="p-[60px_20px] text-center">
          <p className="text-xl font-semibold text-[#333]">
            Ничего не найдено!
          </p>
          <p className="text-base text-[#666]">
            Попробуйте изменить параметры поиска
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-[50px] w-full">
      <h2 className="mb-10 text-center text-2xl font-bold text-[#333]">
        Варианты для проживания: {foundCount}
        {searchQuery && (
          <p className="text-lg font-semibold">Город: {searchQuery}</p>
        )}
        {totalGuests > 1 && (
          <p className="text-base font-normal">
            Количество человек: {totalGuests}
          </p>
        )}
      </h2>

      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-[50px] px-5 max-md:grid-cols-1 max-md:gap-5 max-md:px-4">
        {filteredApartments.map((apartment) => (
          <ApartmentCard
            key={apartment.id}
            apartment={apartment}
            isFavorite={favIds?.includes(apartment.id) ?? false}
          />
        ))}
      </div>
    </div>
  );
}
