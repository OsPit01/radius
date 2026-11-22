import type { IconComponent } from '@/components/icons';

type SegmentedTabsProps<T extends string | number> = {
    tabs: readonly { id: T; label: string; Icon?: IconComponent }[];
    active: T;
    onChange: (id: T) => void;
    className?: string;
};

/**
 * Вкладки-табы с нижней чертой (underline): активная вкладка подчёркнута снизу,
 * остальные приглушены. Одна строка, на узком экране прокручивается по горизонтали.
 */
export function SegmentedTabs<T extends string | number>({ tabs, active, onChange, className }: SegmentedTabsProps<T>) {
    return (
        <div
            role="tablist"
            className={`flex [scrollbar-width:none] gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden ${className}`}
        >
            {tabs.map((tab, index) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active === tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`mb-4 inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-12 pb-2.5 text-base font-medium whitespace-nowrap transition-colors max-lg:px-4 max-md:px-2 ${
                        index === 0 ? 'ml-auto' : ''
                    } ${index === tabs.length - 1 ? 'mr-auto' : ''} ${
                        active === tab.id
                            ? 'border-primary text-foreground'
                            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                >
                    {tab.Icon && <tab.Icon className="h-5 w-5" />}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
