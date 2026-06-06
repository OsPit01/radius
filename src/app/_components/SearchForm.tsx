"use client";

import { useState } from "react";
import "./SearchForm.css";
import { $ZodAny } from "zod/v4/core";

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
  const adultsGuests = adults;
  const adultsText = adults < 2 ? "Взрослый" : "Взрослых";
  const childrenText =
    children === 0
      ? "без детей"
      : children === 1
        ? children + " " + "ребёнок"
        : children < 5
          ? children + " " + "ребёнка"
          : children + " " + "детей";

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
            {adultsGuests + " " + adultsText + ", " + childrenText}
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
                <div className="adults-row">
                  <span className="adults-text"> Взрослые от 18 лет </span>

                  <div className="counter-btn-row-adults">
                    {" "}
                    <button
                      className="counter-btn-adults"
                      onClick={() => decrease("adults")}
                      disabled={adults < 1}
                    >
                      -
                    </button>
                    <span className="counter-value-adults"> {adults}</span>
                    <button
                      className="counter-btn-adults"
                      onClick={() => increase("adults")}
                      disabled={adults >= 25}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* ДЕТИ */}
                <div className="children-row">
                  <span className="children-text"> Дети</span>

                  <div className="counter-btn-row-children">
                    <button
                      className="counter-btn-children"
                      onClick={() => decrease("children")}
                      disabled={children < 0}
                    >
                      -
                    </button>
                    <span className="counter-value-children">{children}</span>
                    <button
                      className="counter-btn-children"
                      onClick={() => increase("children")}
                      disabled={children >= 20}
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
