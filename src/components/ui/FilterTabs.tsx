type FilterTab = {
    id: string;
    label: string;
    count: number;
};
type FilterTabsProps = {
    tabs: readonly FilterTab[];
    active: string;
    onChange: (id: string) => void;
};

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
    return (
        <div className="flex flex-wrap gap-2 py-5">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    aria-pressed={active === tab.id}
                    className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        active === tab.id
                            ? 'border-primary text-primary'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                >
                    {tab.label} ({tab.count})
                </button>
            ))}
        </div>
    );
}
