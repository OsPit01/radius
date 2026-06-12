"use client";

import { useState } from "react";
import "./SearchForm.css";

type SearchFormProps = {
  onSearchClick: () => void; // вызывается при нажатии на лупу
  onTempQueryChange: (query: string) => void; // вызывается при изменении текста
  onTempGuestsChange: (guests: number) => void;
  isLoading?: boolean;
};

export function SearchForm({
  onSearchClick,
  onTempQueryChange,
  onTempGuestsChange,
  isLoading = false,
}: SearchFormProps) {
  // ===== ВРЕМЕННЫЕ СОСТОЯНИЯ (живут только внутри SearchForm) =====
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [isGuestWindowOpen, setIsGuestWindowOpen] = useState(false);
  const [tempAdults, setTempAdults] = useState(1);
  const [tempChildren, setTempChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);

  // ===== ОБНОВЛЕНИЕ ВРЕМЕННЫХ ЗНАЧЕНИЙ =====
  // Каждый раз, когда пользователь меняет текст или гостей,
  // мы сообщаем родительскому компоненту новые временные значения
  const updateTempQuery = (query: string) => {
    setTempSearchQuery(query);
    onTempQueryChange(query);
  };

  const updateTempGuests = (adults: number, children: number) => {
    const total = adults + children;
    onTempGuestsChange(total);
  };

  // ===== УВЕЛИЧЕНИЕ КОЛИЧЕСТВА =====
  const increase = (type: "adults" | "children" | "pets") => {
    if (type === "adults" && tempAdults < 20) {
      const newAdults = tempAdults + 1;
      setTempAdults(newAdults);
      updateTempGuests(newAdults, tempChildren);
    }
    if (type === "children" && tempChildren < 20) {
      const newChildren = tempChildren + 1;
      setTempChildren(newChildren);
      setChildAges([...childAges, 0]);
      updateTempGuests(tempAdults, newChildren);
    }
    if (type === "pets" && pets < 20) {
      setPets(pets + 1);
    }
  };

  // ===== УМЕНЬШЕНИЕ КОЛИЧЕСТВА =====
  const decrease = (type: "adults" | "children" | "pets") => {
    if (type === "adults" && tempAdults > 1) {
      const newAdults = tempAdults - 1;
      setTempAdults(newAdults);
      updateTempGuests(newAdults, tempChildren);
    }
    if (type === "children" && tempChildren > 0) {
      const newChildren = tempChildren - 1;
      setTempChildren(newChildren);
      setChildAges(childAges.slice(0, -1));
      updateTempGuests(tempAdults, newChildren);
    }
    if (type === "pets" && pets > 0) {
      setPets(pets - 1);
    }
  };

  // ===== ОБРАБОТЧИК ИЗМЕНЕНИЯ ТЕКСТА =====
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    updateTempQuery(newQuery);
  };

  // ===== ОБРАБОТЧИК ЗАКРЫТИЯ ПОПАПА (кнопка "Готово") =====
  const handleGuestWindowClose = () => {
    setIsGuestWindowOpen(false);
    // Когда пользователь нажал "Готово", обновляем временное количество гостей
    updateTempGuests(tempAdults, tempChildren);
  };

  // ===== ТЕКСТ ДЛЯ КНОПКИ ГОСТЕЙ =====
  const adultsText = tempAdults === 1 ? "Взрослый" : "Взрослых";
  const childrenText =
    tempChildren === 0
      ? "без детей"
      : tempChildren === 1
        ? tempChildren + " " + "ребёнок"
        : tempChildren < 5
          ? tempChildren + " " + "ребёнка"
          : tempChildren + " " + "детей";

  const updateChildAge = (index: number, age: number) => {
    const newAges = [...childAges];
    newAges[index] = age;
    setChildAges(newAges);
  };

  return (
    <div className="search-section">
      <div className="search-container">
        {/* ===== ПОЛЕ ВВОДА ===== */}
        <input
          type="text"
          className="search-input"
          placeholder="Поиск жилья..."
          value={tempSearchQuery}
          onChange={handleSearchChange}
        />

        {/* ===== КНОПКА ГОСТЕЙ ===== */}
        <div className="guests-wrapper">
          <button
            className="guests-button"
            onClick={() => setIsGuestWindowOpen(true)}
          >
            {tempAdults} {adultsText}, {childrenText}
          </button>

          {/* ПОПАП */}
          {isGuestWindowOpen && (
            <>
              <div
                className="window-overlay"
                onClick={() => setIsGuestWindowOpen(false)}
              />
              <div className="guests-modal">
                <h3 className="window-title">кто едет?</h3>

                {/* ВЗРОСЛЫЕ */}
                <div className="adults-row">
                  <span className="adults-text">Взрослые от 18 лет</span>
                  <div className="counter-btn-row-adults">
                    <button
                      className="counter-btn-adults"
                      onClick={() => decrease("adults")}
                      disabled={tempAdults <= 1}
                    >
                      -
                    </button>
                    <span className="counter-value-adults">{tempAdults}</span>
                    <button
                      className="counter-btn-adults"
                      onClick={() => increase("adults")}
                      disabled={tempAdults >= 25}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ДЕТИ */}
                <div className="children-row">
                  <span className="children-text">Дети</span>
                  <div className="counter-btn-row-children">
                    <button
                      className="counter-btn-children"
                      onClick={() => decrease("children")}
                      disabled={tempChildren <= 0}
                    >
                      -
                    </button>
                    <span className="counter-value-children">
                      {tempChildren}
                    </span>
                    <button
                      className="counter-btn-children"
                      onClick={() => increase("children")}
                      disabled={tempChildren >= 20}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ВОЗРАСТ ДЕТЕЙ */}
                {tempChildren > 0 && (
                  <div className="child-ages-section">
                    <div className="child-ages-title">Возраст детей:</div>
                    {childAges.map((age, index) => (
                      <div key={index} className="child-age-row">
                        <span className="child-age-label">
                          Ребёнок {index + 1}
                        </span>
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

                {/* КНОПКА ГОТОВО */}
                <button
                  className="modal-done-btn"
                  onClick={handleGuestWindowClose}
                >
                  Готово
                </button>
              </div>
            </>
          )}
        </div>

        {/* ===== КНОПКА ЛУПЫ - ЗАПУСКАЕТ ПОИСК ===== */}
        <button className="search-input-icon" onClick={onSearchClick}>
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
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

function getAgeText(age: number): string {
  if (age % 10 === 1 && age % 100 !== 11) return "год";
  if (age % 10 >= 2 && age % 10 <= 4 && (age % 100 < 10 || age % 100 >= 20))
    return "года";
  return "лет";
}
