import type { IconComponent } from '@/components/icons';

type SegmentedTabsProps<T extends string | number> = {
    tabs: readonly { id: T; label: string; Icon?: IconComponent }[];
    active: T;
    onChange: (id: T) => void;
    /** На мобилке прокручивать вкладки по горизонтали вместо переноса (для длинных наборов, например ролей). */
    scrollOnMobile?: boolean;
};

/**
 * Сегментные вкладки: кнопки на общей подложке, активная — залита.
 * По умолчанию вкладки растягиваются и переносятся (страница квартиры, «Мои брони»).
 * С scrollOnMobile — на мобилке едут по горизонтали (роли в /admin/users).
 */
export function SegmentedTabs<T extends string | number>({
    tabs,
    active,
    onChange,
    scrollOnMobile = false,
}: SegmentedTabsProps<T>) {
    return (
        <div
            role="tablist"
            className={`flex flex-wrap justify-center gap-2 rounded-2xl bg-muted p-2 max-sm:gap-1.5 ${
                scrollOnMobile
                    ? '[scrollbar-width:none] max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto [&::-webkit-scrollbar]:hidden'
                    : 'max-sm:grid max-sm:grid-cols-2 sm:divide-x sm:divide-border max-sm:[&>:nth-child(3):last-child]:col-span-2 max-sm:[&>:nth-child(even)]:border-l max-sm:[&>:nth-child(n+3)]:border-t'
            }`}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active === tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                        scrollOnMobile
                            ? 'flex-1 text-[15px] max-sm:flex-none max-sm:shrink-0 max-sm:text-sm max-sm:whitespace-nowrap'
                            : 'flex-1 text-[15px] max-sm:w-full max-sm:border-border max-sm:text-sm'
                    } ${
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
