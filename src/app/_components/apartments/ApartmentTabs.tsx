"use client";
import { useState } from "react";
import { AMENITIES } from "@/lib/constants/amenities";

const TABS = ["Описание", "Удобства", "Правила", "Карта"] as const;

export function ApartmentTabs({
  description,
  amenities,
  rules,
}: {
  description: string;
  amenities: string[];
  rules: string;
}) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap justify-center gap-2 border-b border-[#e0e0e0] pb-4">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`rounded-full px-5 py-2.5 text-sm text-[18px] font-medium text-black transition-all duration-200 ${
              activeTab === i
                ? "bg-[#b552c7] text-white shadow-[0_4px_12px_rgba(181,82,199,0.3)]"
                : "text-[#666] hover:bg-[#f0f0f0] hover:text-[#222]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="py-8">
        {activeTab === 0 && (
          <p className="mx-auto max-w-2xl text-center text-base leading-relaxed whitespace-pre-line text-black">
            {description || "Описание пока не добавлено"}
          </p>
        )}

        {activeTab === 1 && (
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 max-md:grid-cols-1">
            {amenities.map((id) => {
              const found = AMENITIES.find((a) => a.id === id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2.5 rounded-xl bg-[#f7f7f7] px-4 py-3 text-sm text-black"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#b552c7] text-xs text-white">
                    ✓
                  </span>
                  {found?.label ?? id}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 2 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#eee5f4] bg-[#faf7fc] p-6">
            {rules ? (
              <p className="text-base leading-relaxed whitespace-pre-line text-black">
                {rules}
              </p>
            ) : (
              <p className="text-base text-black">
                Правила проживания не указаны
              </p>
            )}
          </div>
        )}

        {activeTab === 3 && <p className="text-center text-black">Карта</p>}
      </div>
    </div>
  );
}
