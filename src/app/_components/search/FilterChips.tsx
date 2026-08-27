"use client";

import type { Filters } from "./FilterPanel";

export type ChipKey = "priceMin" | "priceMax" | "rooms";

export function FilterChips({
  filters,
  onRemove,
  onClear,
}: {
  filters: Filters;
  onRemove: (key: ChipKey) => void;
  onClear: () => void;
}) {
  const chips: { key: ChipKey; label: string }[] = [];
  if (filters.priceMin) {
    chips.push({ key: "priceMin", label: `от ${filters.priceMin} BYN` });
  }
  if (filters.priceMax) {
    chips.push({ key: "priceMax", label: `до ${filters.priceMax} BYN` });
  }
  if (filters.rooms !== null) {
    const label = filters.rooms === 4 ? "4+" : String(filters.rooms);
    chips.push({ key: "rooms", label: `${label} ${roomWord(filters.rooms)}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mx-auto mt-4 flex w-full max-w-[1400px] items-center gap-2 overflow-x-auto px-5 pb-1 max-md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex shrink-0 items-center gap-2 rounded-full border border-[#b552c7] bg-[rgba(181,82,199,0.06)] px-4 py-1.5 text-sm font-medium text-[#222]"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-[#b552c7] transition-colors hover:bg-[#b552c7] hover:text-white"
            aria-label={`Убрать фильтр ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 cursor-pointer text-sm font-medium text-[#b552c7] underline-offset-2 hover:underline"
      >
        Сбросить
      </button>
    </div>
  );
}

function roomWord(rooms: number) {
  if (rooms === 1) return "комната";
  if (rooms >= 2 && rooms <= 4) return "комнаты";
  return "комнат";
}
