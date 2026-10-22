import type { IconComponent } from '@/components/icons';

type SegmentedTabsProps<T extends string | number> = {
    tabs: readonly { id: T; label: string; Icon?: IconComponent }[];
    active: T;
    onChange: (id: T) => void;
};

/**
 * Сегментные вкладки: кнопки на общей подложке, активная — залита.
 * Используется на странице квартиры (Описание / Удобства / …)
 * и в «Моих бронях» (Новые / Активные / …).
 */
export function SegmentedTabs<T extends string | number>({ tabs, active, onChange }: SegmentedTabsProps<T>) {
    return (
        <div
            role="tablist"
            className="flex flex-wrap justify-center gap-2 rounded-2xl bg-muted p-2 max-sm:gap-1.5"
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active === tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200 max-sm:min-w-[45%] ${
                        active === tab.id
                            ? 'bg-foreground text-background shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                            : 'text-muted-foreground hover:bg-card hover:text-foreground'
                    }`}
                >
                    {tab.Icon && <tab.Icon className="h-5 w-5" />}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
