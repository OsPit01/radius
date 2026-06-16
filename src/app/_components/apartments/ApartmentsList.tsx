"use client";

import { ApartmentCard } from "./ApartmentCard";
import "./ApartmentsList.css";

type ApartmentsListProps = {
  searchQuery?: string;
  totalGuests?: number;
};

const testApartmentList = [
  {
    id: 1,
    title: "Уютная квартира",
    city: "Минск",
    district: "Авиационная 16",
    capacity: 3, // сколько человек может жить
    price: 3500, // цена за сутки
    image: "/assets/images/mainaviac.jpg",
    description: "Уютная квартира в целом стиле",
    rooms: 1, // сколько комнат в квартире
    metro: "нет",
  },
  {
    id: 2,
    title: "Современная студия у метро",
    city: "Минск",
    district: "Первомайский район",
    capacity: 4,
    price: 2800,
    image: "/assets/images/maintur.jpg",
    description: "Уютная квартира в целом стиле",
    rooms: 2, // сколько комнат в квартире
    metro: "Восток",
  },
];

export function ApartmentsList({
  searchQuery = "",
  totalGuests = 1,
}: ApartmentsListProps) {
  // .filter() - метод массива, который оставляет только элементы,
  // для которых функция вернула true
  const filteredApartments = testApartmentList.filter((apartment) => {
    const matchesSearch =
      searchQuery === "" ||
      apartment.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCapacity = apartment.capacity >= totalGuests;
    return matchesSearch && matchesCapacity;
  });
  const foundCount = filteredApartments.length;

  return (
    <div className="section-apartments">
      <h2 className="apartments-title">
        Варианты для проживания: {foundCount}
        {/* Если есть текст поиска - показываем его */}
        <p className="search-query">
          {searchQuery && ` Город: "${searchQuery}"`}{" "}
        </p>
        {/* Если количество гостей больше 1 - показываем */}
        <p className="search-guests">
          {totalGuests > 1 && `Количество человек: ${totalGuests}`}{" "}
        </p>
      </h2>
      {foundCount === 0 ? (
        <div className="no-result">
          <p> Ничего не найдено! </p>
          <p>Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div className="apartments-grid">
          {filteredApartments.map((apartment) => (
            <ApartmentCard key={apartment.id} apartment={apartment} />
          ))}
        </div>
      )}
    </div>
  );
}
