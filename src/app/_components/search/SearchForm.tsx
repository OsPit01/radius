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
  // Состояние для возраста каждого ребёнка (массив)
  const [childAges, setChildAges] = useState<number[]>([]);
  // Функция увеличивает количество
  const increase = (type: "adults" | "children" | "pets") => {
    if (type === "adults" && adults < 20) setAdults(adults + 1);
    if (type === "children" && children < 20) setChildren(children + 1);
    setChildAges([...childAges, 0]);
    if (type === "pets" && pets < 20) setPets(pets + 1);
  };
  // уменьшает количество Взрослых
  const decrease = (type: "adults" | "children" | "pets") => {
    if (type === "adults" && adults > 1) setAdults(adults - 1);
    if (type === "children" && children > 0) setChildren(children - 1);
    setChildAges(childAges.slice(0, -1));
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

  // Функция  указать возраст  ребёнка
  const updateChildAge = (index: number, age: number) => {
    const newAges = [...childAges];
    newAges[index] = age;
    setChildAges(newAges);
  };
  //  кнопка гостей

  return (
    <div className="search-section">
      <div className="search-container">
        {/* ПОЛЕ ВВОДА */}
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
                {/* ===== ВЫБОР ВОЗРАСТА ДЛЯ КАЖДОГО РЕБЁНКА ===== */}
                {/* Показываем только если есть дети */}
                {children > 0 && (
                  <div className="child-ages-section">
                    <div className="child-ages-title"> Возраст детей: </div>
                    {childAges.map((age, index) => (
                      <div key={index} className="child-age-row">
                        <span className="child-age-label">
                          {" "}
                          Ребёнок {index + 1}
                        </span>
                        {/* DROPDOWN для выбора возраста */}
                        <select
                          className="child-age-select"
                          value={age}
                          onChange={(e) =>
                            updateChildAge(index, Number(e.target.value))
                          }
                        >
                          {[...Array(18).keys()].map((ageNum) => (
                            <option key={ageNum} value={ageNum}>
                              {ageNum} {getAgeText(ageNum)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                {/* Питомцы, но потом */}

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
          {/* ===== ИКОНКА ЛУПЫ ===== */}
        </div>
        <span className="search-input-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <a href="#" className="icon-link"></a>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        {/* ================= КОНЕЦ ОБЁРТКИ ================= */}
      </div>
    </div>
  );
}
//функция для склонения слова "год"
function getAgeText(age: number): string {
  if (age % 10 === 1 && age % 100 !== 11) return "год";
  if (age % 10 >= 2 && age % 10 <= 4 && (age % 100 < 10 || age % 100 >= 20))
    return "года";
  return "лет";
}
