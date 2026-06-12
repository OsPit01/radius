"use client";
import { useState } from "react";
import { SearchForm } from "@/app/_components/search/SearchForm";
import { ApartmentsList } from "@/app/_components/apartments/ApartmentsList";

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
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Поиск...</p>
        </div>
      ) : (
        <ApartmentsList
          searchQuery={activeSearchQuery} // ← активные значения фильтров
          totalGuests={activeTotalGuests}
        />
      )}
    </>
  );
}
