"use client";

import { ApartmentCard } from "./ApartmentCard";
import "./ApartmentsList.css";

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
      <div className="section-apartments">
        <h2 className="apartments-title">Варианты для проживания: 0</h2>
        <div className="no-result">
          <p>Ничего не найдено!</p>
          <p>Попробуйте изменить параметры поиска</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-apartments">
      <h2 className="apartments-title">
        Варианты для проживания: {foundCount}
        {searchQuery && <p className="search-query">Город: {searchQuery}</p>}
        {totalGuests > 1 && (
          <p className="search-guests">Количество человек: {totalGuests}</p>
        )}
      </h2>

      <div className="apartments-grid">
        {filteredApartments.map((apartment) => (
          <ApartmentCard key={apartment.id} apartment={apartment} />
        ))}
      </div>
    </div>
  );
}
