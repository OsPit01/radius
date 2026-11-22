import { Close } from '@/components/icons';
import { plural } from '@/utils/plural';

import type { Filters } from './FilterPanel';

export type ChipKey = 'priceMin' | 'priceMax' | 'rooms' | 'beds' | 'sofas' | 'metro';

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
        chips.push({ key: 'priceMin', label: `от ${filters.priceMin} BYN` });
    }
    if (filters.priceMax) {
        chips.push({ key: 'priceMax', label: `до ${filters.priceMax} BYN` });
    }
    const { rooms, beds, sofas } = filters;
    if (rooms !== null) {
        const label = rooms === 4 ? 'от 4 комнат' : `${rooms} ${plural(rooms, 'комната', 'комнаты', 'комнат')}`;
        chips.push({ key: 'rooms', label });
    }
    if (beds !== null) {
        chips.push({
            key: 'beds',
            label: `от ${beds} ${plural(beds, 'кровати', 'кроватей', 'кроватей')}`,
        });
    }
    if (sofas !== null) {
        chips.push({
            key: 'sofas',
            label: `от ${sofas} ${plural(sofas, 'дивана', 'диванов', 'диванов')}`,
        });
    }
    if (filters.metro !== null) {
        chips.push({
            key: 'metro',
            label: `метро: до ${filters.metro} мин`,
        });
    }

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className="mx-auto mt-4 flex w-full max-w-7xl [scrollbar-width:none] items-center gap-2 overflow-x-auto px-5 pb-1 max-md:px-4 [&::-webkit-scrollbar]:hidden">
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-primary bg-primary/6 px-4 py-1.5 text-sm font-medium text-foreground"
                >
                    {chip.label}
                    <button
                        type="button"
                        onClick={() => onRemove(chip.key)}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/90 hover:text-primary-foreground"
                        aria-label={`Убрать фильтр ${chip.label}`}
                    >
                        <Close className="h-3.5 w-3.5" />
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={onClear}
                className="shrink-0 cursor-pointer text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
                Сбросить
            </button>
        </div>
    );
}
