"use client";

import { useState } from "react";
import "./SearchForm.css";

export function SearchForm() {
  // Состояние для текста поиска
  const [searchQuery, setSearchQuery] = useState("");
  // Состояние для открытия/закрытия попапа гостей
  const [isGuestWindowOpen, setIsGuestWindowOpen] = useState(false);
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
  const guestText = "гостей";

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
        {/* КНОПКА, ПО КОТОРОЙ КЛИКАЮТ, ЧТОБЫ ОТКРЫТЬ ПОПАП */}
        {/* Условие: если isGuestModalOpen === true, то показываем попап */}
        <div className="guests-wrapper">
          <button
            className="guests-button"
            onClick={() => setIsGuestWindowOpen(true)}
          >
            {totalGuest + " " + guestText}
          </button>

          {/* ================= ПОПАП  ================= */}
          {isGuestWindowOpen && (
            <>
              {/* ПОДЛОЖКА */}
              <div
                className="window-overlay"
                onClick={() => setIsGuestWindowOpen(false)}
              />
              {/* САМ ПОПАП */}
              <div className="guests-modal">
                <h3 className="window-title">кто едет?</h3>
                {/* ВЗРОСЛЫЕ */}
                <div className="guests-row">
                  <div className="guests-ingo">
                    <span className="guests-name"> Взрослые </span>
                    <span className="guests-info"> От 18 лет </span>
                  </div>
                  <div className="counter-btn">
                    {" "}
                    <button
                      className="counter-btn"
                      onClick={() => decrease("adults")}
                      disabled={adults <= 1}
                    >
                      -
                    </button>
                    <span className="counter-value"> {adults}</span>
                    <button
                      className="counter-btn"
                      onClick={() => increase("adults")}
                      disabled={adults >= 25}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* КНОПКА ГОТОВО */}
                <button
                  className="modal-done-btn"
                  onClick={() => setIsGuestWindowOpen(false)}
                >
                  Готово
                </button>
              </div>
            </>
          )}
        </div>
        {/* ================= КОНЕЦ ОБЁРТКИ ================= */}
      </div>
    </div>
  );
}
