"use client";

export type Filters = {
  priceMin: string;
  priceMax: string;
  rooms: number | null; // null = не выбрано, 4 = "4+"
};

export const EMPTY_FILTERS: Filters = {
  priceMin: "",
  priceMax: "",
  rooms: null,
};

const ROOM_OPTIONS = [1, 2, 3, 4]; // 4 отображается как "4+"

export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Цена */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[#222]">
          Цена за сутки, BYN
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="от"
            value={filters.priceMin}
            onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
            className="w-full rounded-xl border border-[#e0e0e0] bg-white px-3.5 py-2.5 text-sm text-[#222] outline-none transition-colors focus:border-[#7e22ce]"
          />
          <span className="shrink-0 text-[#999]">—</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="до"
            value={filters.priceMax}
            onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
            className="w-full rounded-xl border border-[#e0e0e0] bg-white px-3.5 py-2.5 text-sm text-[#222] outline-none transition-colors focus:border-[#7e22ce]"
          />
        </div>
      </div>

      {/* Комнаты */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[#222]">
          Количество комнат
        </p>
        <div className="flex flex-wrap gap-2">
          {ROOM_OPTIONS.map((r) => {
            const active = filters.rooms === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ ...filters, rooms: active ? null : r })}
                className={`min-w-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border-[#7e22ce] bg-[#7e22ce] text-white shadow-[0_4px_12px_rgba(126,34,206,0.3)]"
                    : "border-[#e0e0e0] bg-white text-[#222] hover:border-[#7e22ce]"
                }`}
              >
                {r === 4 ? "4+" : r}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
