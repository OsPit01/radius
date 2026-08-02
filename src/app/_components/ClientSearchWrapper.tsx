"use client";
import { useEffect, useState } from "react";
import { SearchForm } from "@/app/_components/search/SearchForm";
import { ApartmentsList } from "@/app/_components/apartments/ApartmentsList";
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
export function ClientSearchWrapper() {
  // ===== СОСТОЯНИЯ ДЛЯ ФИЛЬТРОВ =====
  // Эти значения будут использоваться для фильтрации списка
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [activeTotalGuests, setActiveTotalGuests] = useState(1);

  // ===== ВРЕМЕННЫЕ СОСТОЯНИЯ (пока пользователь не нажал лупу) =====
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [tempTotalGuests, setTempTotalGuests] = useState(1);
  // ===== СОСТОЯНИЕ ДЛЯ ЗАГРУЗКИ =====
  const [isLoading, setIsLoading] = useState(false);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  // ===== ПОЛУЧАЕМ КВАРТИРЫ ИЗ БД =====
  const { data: apartmentsData } = api.apartment.getAll.useQuery();
  // ===== ФУНКЦИЯ ПЕРЕМЕШИВАНИЯ =====
  const shuffleApartments = (list: Apartment[]) => {
    return [...list].sort(() => Math.random() - 0.5);
  };
  // ===== ЗАГРУЗКА ДАННЫХ С ПЕРЕМЕШИВАНИЕМ =====
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
  // ===== ПЕРЕМЕШИВАНИЕ КАЖДЫЕ 5 МИНУТ =====
  useEffect(() => {
    if (apartments.length === 0) return;
    // Таймер обновления
    const interval = setInterval(() => {
      setApartments((prev) => shuffleApartments(prev));
    }, 300000);
    // Очистка при размонтировании
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

  // ===== ФУНКЦИЯ-ОБРАБОТЧИК =====
  // Эту функцию мы передадим в SearchForm
  // Когда пользователь меняет поиск или гостей - эта функция обновит состояния
  const handleSearch = () => {
    // Включаем индикатор загрузки
    setIsLoading(true);
    // Обновляем состояние поискового запроса и количества гостей
    setActiveSearchQuery(tempSearchQuery);
    setActiveTotalGuests(tempTotalGuests);
    // Симулируем задержку (как будто идёт запрос к серверу)
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };
  // ===== ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ВРЕМЕННЫХ ЗНАЧЕНИЙ =====
  const updateTempQuery = (query: string) => {
    setTempSearchQuery(query);
  };

  const updateTempGuests = (guests: number) => {
    setTempTotalGuests(guests);
  };

  // Разметка
  return (
    <>
      <SearchForm
        onSearchClick={handleSearch} // ← вызывается при нажатии на лупу
        onTempQueryChange={updateTempQuery}
        onTempGuestsChange={updateTempGuests}
        isLoading={isLoading} // ← передаём состояние загрузки
      />{" "}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-[60px_20px] text-center text-[#888]">
          <div className="h-[50px] w-[50px] animate-spin rounded-full border-4 border-[#f3f3f3] border-t-[#ff5a5f]"></div>
          <p className="mt-5 text-lg text-[#666]">Поиск...</p>
        </div>
      ) : (
        <ApartmentsList
          apartments={apartments}
          searchQuery={activeSearchQuery} // ← активные значения фильтров
          totalGuests={activeTotalGuests}
        />
      )}
    </>
  );
}
