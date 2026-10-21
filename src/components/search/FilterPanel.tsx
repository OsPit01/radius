export type Filters = {
    priceMin: string;
    priceMax: string;
    rooms: number | null; // null = не выбрано, 4 = "4+"
    beds: number | null; // null = не выбрано, 4 = "4+"
    sofas: number | null; // null = не выбрано, 4 = "4+"
    metro: number | null; // null = не выбрано, значение = "до N минут пешком"
};

export const EMPTY_FILTERS: Filters = {
    priceMin: '',
    priceMax: '',
    rooms: null,
    beds: null,
    sofas: null,
    metro: null,
};

const COUNT_OPTIONS = [1, 2, 3, 4]; // 4 отображается как "4+"
const METRO_OPTIONS = [5, 10, 15, 20, 25, 30]; // до N минут пешком

export function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
    return (
        <div className="flex flex-col gap-6">
            {/* Цена */}
            <div>
                <p className="mb-3 text-sm font-semibold text-[#222]">Цена за сутки, BYN</p>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="от"
                        value={filters.priceMin}
                        onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
                        className="w-full rounded-xl border border-[#e0e0e0] bg-white px-3.5 py-2.5 text-sm text-[#222] transition-colors outline-none focus:border-[#6b21a8]"
                    />
                    <span className="shrink-0 text-[#999]">—</span>
                    <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="до"
                        value={filters.priceMax}
                        onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
                        className="w-full rounded-xl border border-[#e0e0e0] bg-white px-3.5 py-2.5 text-sm text-[#222] transition-colors outline-none focus:border-[#6b21a8]"
                    />
                </div>
            </div>

            {/* Комнаты */}
            <div>
                <p className="mb-3 text-sm font-semibold text-[#222]">Количество комнат</p>
                <div className="flex flex-wrap gap-2">
                    {COUNT_OPTIONS.map((r) => {
                        const active = filters.rooms === r;
                        return (
                            <button
                                key={r}
                                type="button"
                                onClick={() => onChange({ ...filters, rooms: active ? null : r })}
                                className={`min-w-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? 'border-gray-800 bg-gray-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                                        : 'border-[#e0e0e0] bg-white text-[#222] hover:border-gray-800'
                                }`}
                            >
                                {r === 4 ? '4+' : r}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Кровати (минимум) */}
            <div>
                <p className="mb-3 text-sm font-semibold text-[#222]">Кроватей не меньше, чем</p>
                <div className="flex flex-wrap gap-2">
                    {COUNT_OPTIONS.map((n) => {
                        const active = filters.beds === n;
                        return (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onChange({ ...filters, beds: active ? null : n })}
                                className={`min-w-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? 'border-gray-800 bg-gray-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                                        : 'border-[#e0e0e0] bg-white text-[#222] hover:border-gray-800'
                                }`}
                            >
                                {n === 4 ? '4+' : n}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Диваны (минимум) */}
            <div>
                <p className="mb-3 text-sm font-semibold text-[#222]">Диванов не меньше, чем</p>
                <div className="flex flex-wrap gap-2">
                    {COUNT_OPTIONS.map((n) => {
                        const active = filters.sofas === n;
                        return (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onChange({ ...filters, sofas: active ? null : n })}
                                className={`min-w-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? 'border-gray-800 bg-gray-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                                        : 'border-[#e0e0e0] bg-white text-[#222] hover:border-gray-800'
                                }`}
                            >
                                {n === 4 ? '4+' : n}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Метро (до N минут пешком) */}
            <div>
                <p className="mb-3 text-sm font-semibold text-[#222]">До метро, минут</p>
                <select
                    value={filters.metro ?? ''}
                    onChange={(e) =>
                        onChange({
                            ...filters,
                            metro: e.target.value ? Number(e.target.value) : null,
                        })
                    }
                    className="w-full cursor-pointer rounded-xl border border-[#e0e0e0] bg-white px-3.5 py-2.5 text-sm text-[#222] transition-colors outline-none focus:border-[#6b21a8]"
                >
                    <option value="">Любое</option>
                    {METRO_OPTIONS.map((m) => (
                        <option
                            key={m}
                            value={m}
                        >
                            до {m} минут
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
