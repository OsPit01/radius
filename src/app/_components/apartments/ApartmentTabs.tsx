"use client";
import { useState } from "react";
import { AMENITIES } from "@/lib/constants/amenities";
export function ApartmentTabs({
  description,
  amenities,
  rooms,
  capacity,
}: {
  description: string;
  amenities: string[];
  rooms: number;
  capacity: number;
}) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col items-center pt-5">
      <div className="flex border-b border-[#e0e0e0]">
        <button
          onClick={() => setActiveTab(0)}
          className={
            activeTab === 0
              ? "flex-1 border-b-2 border-[#222] px-2 py-4 text-center text-base font-medium whitespace-nowrap text-[#222] max-md:text-sm"
              : "flex-1 px-2 py-4 text-center text-base whitespace-nowrap text-[#999] hover:text-[#555] max-md:text-sm"
          }
        >
          Описание
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={
            activeTab === 1
              ? "flex-1 border-b-2 border-[#222] px-2 py-4 text-center text-base font-medium whitespace-nowrap text-[#222] max-md:text-sm"
              : "flex-1 px-2 py-4 text-center text-base whitespace-nowrap text-[#999] hover:text-[#555] max-md:text-sm"
          }
        >
          Удобства
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={
            activeTab === 2
              ? "flex-1 border-b-2 border-[#222] px-2 py-4 text-center text-base font-medium whitespace-nowrap text-[#222] max-md:text-sm"
              : "flex-1 px-2 py-4 text-center text-base whitespace-nowrap text-[#999] hover:text-[#555] max-md:text-sm"
          }
        >
          Правила
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={
            activeTab === 3
              ? "flex-1 border-b-2 border-[#222] px-2 py-4 text-center text-base font-medium whitespace-nowrap text-[#222] max-md:text-sm"
              : "flex-1 px-2 py-4 text-center text-base whitespace-nowrap text-[#999] hover:text-[#555] max-md:text-sm"
          }
        >
          Карта
        </button>
      </div>
      <div className="py-4">
        {activeTab === 0 && <>{description}</>}
        {activeTab === 1 && (
          <ul>
            {amenities.map((id) => {
              const found = AMENITIES.find((a) => a.id === id);
              return <li key={id}>• {found?.label ?? id}</li>;
            })}
          </ul>
        )}
        {activeTab === 2 && <p>Правила проживания...</p>}
        {activeTab === 3 && <p>Карта</p>}
      </div>
    </div>
  );
}
