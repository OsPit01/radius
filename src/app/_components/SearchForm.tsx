"use client";

import { useState } from "react";
import "./SearchForm.css";
import { set } from "zod/v4";
export function SearchForm() {
  // Состояние для текста поиска
  const [searchQuery, setSearchQuery] = useState("");
  // Состояние для открытия/закрытия попапа гостей
  const [isGuestWidnowOpen, setIsGuestWindowOpen] = useState(false);
  // Состояние для количества гостей
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);

  // Функция увеличивает количество
  const increase = (type: "adults" | "children" | "pets") => {
    if (type === "adults" && adults < 20) setAdults(adults + 1);
    if (type === "children" && children < 20) setChildren(children + 1);
    if (type === "pets" && pets < 20) setPets(pets + 1);
  };
  // уменьшает количество гостей
  const decrease = (type: "adults" | "children" | "pets") => {
    if (type === "adults" && adults > 1) setAdults(adults - 1);
    if (type === "children" && children > 0) setChildren(children - 1);
    if (type === "pets" && pets > 0) setPets(pets - 1);
  };
  // общее количество гостей
  const totalGuest = adults + children;
  const guestText = '${totalGuests}  "гостей"';

  //  кнопка гостей

  return (
    <div className="search-section">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск жилья..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {/* КНОПКА ДЛЯ ВЫБОРА ГОСТЕЙ - ПО НЕЙ ОТКРЫВАЕТСЯ ПОПАП */}

        <button
          className="guests-button"
          onClick={() => setIsGuestWindowOpen(true)}
        >
          {" "}
          {totalGuest + guestText}
        </button>
      </div>
    </div>
  );
}
