"use client";
import { useState } from "react";
import { AMENITIES } from "@/lib/constants/amenities";

const TABS = [
  { id: 0, label: "Описание", emoji: "📝" },
  { id: 1, label: "Удобства", emoji: "✨" },
  { id: 2, label: "Правила", emoji: "📋" },
  { id: 3, label: "Карта", emoji: "🗺️" },
] as const;

export function ApartmentTabs({
  description,
  amenities,
  rules,
  checkInTime,
  checkOutTime,
}: {
  description: string;
  amenities: string[];
  rules: string;
  checkInTime: string | null;
  checkOutTime: string | null;
}) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="mt-10">
      {/* Вкладки */}
      <div className="flex flex-wrap justify-center gap-2 rounded-2xl bg-[#faf7fc] p-2 max-sm:gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200 max-sm:min-w-[45%] ${
              activeTab === tab.id
                ? "bg-gray-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                : "text-[#666] hover:bg-white hover:text-[#222]"
            }`}
          >
            <span className="text-base">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-8">
        {activeTab === 0 && (
          <div className="mx-auto max-w-2xl">
            {description ? (
              <p className="text-base leading-8 whitespace-pre-line text-[#333]">
                {description}
              </p>
            ) : (
              <p className="text-center text-base text-[#999]">
                Описание пока не добавлено
              </p>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <>
            {amenities.length > 0 ? (
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {amenities.map((id) => {
                  const found = AMENITIES.find((a) => a.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 rounded-xl border border-[#eee5f4] bg-[#faf7fc] px-4 py-3 text-sm text-[#333]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6b21a8] text-xs text-white">
                        ✓
                      </span>
                      {found?.label ?? id}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-base text-[#999]">
                Удобства не указаны
              </p>
            )}
          </>
        )}

        {activeTab === 2 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#eee5f4] bg-[#faf7fc] p-6">
            {(checkInTime ?? checkOutTime) && (
              <div className="mb-6 rounded-2xl border border-[#eee5f4] bg-white p-4 shadow-sm">
                <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#6b21a8]">
                  <span className="text-base">⏰</span>
                  Режим работы
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 rounded-xl bg-[#faf7fc] px-3.5 py-3 text-sm text-[#333]">
                    <span className="text-base">🕒</span>
                    <span>Заселение после</span>
                    <span className="ml-auto rounded-lg bg-[#6b21a8] px-2.5 py-1 text-sm font-semibold text-white">
                      {checkInTime ?? "14:00"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl bg-[#faf7fc] px-3.5 py-3 text-sm text-[#333]">
                    <span className="text-base">🕒</span>
                    <span>Выезд до</span>
                    <span className="ml-auto rounded-lg bg-[#6b21a8] px-2.5 py-1 text-sm font-semibold text-white">
                      {checkOutTime ?? "12:00"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {rules ? (
              <p className="text-base leading-7 whitespace-pre-line text-[#333]">
                {rules}
              </p>
            ) : (
              <p className="text-center text-base text-[#999]">
                Правила проживания не указаны
              </p>
            )}
          </div>
        )}

        {activeTab === 3 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#eee5f4] bg-[#faf7fc] p-6">
            <p className="text-center text-[#999]">
              Карта появится здесь в ближайшее время
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
