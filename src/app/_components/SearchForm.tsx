"use client";

import { useState } from "react";

export function SearchForm() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="search-section">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск квартир, отелей, коттеджей..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
