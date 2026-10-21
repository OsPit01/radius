type TabsProps<T extends string> = {
    tabs: readonly { id: T; label: string }[];
    active: T;
    onChange: (id: T) => void;
};
export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`min-w-0 flex-1 px-2 py-2.5 text-center text-sm font-medium transition-[color,background-color] duration-300 ease-out active:scale-95 max-md:flex-none max-md:px-4 max-md:whitespace-nowrap sm:px-4 ${
                        active === tab.id
                            ? 'cursor-pointer rounded-[25px] border-b-[5px] border-b-primary bg-muted text-[20px] font-semibold text-primary max-md:rounded-full max-md:border-b-primary max-md:text-sm'
                            : 'cursor-pointer border-b-1 border-transparent text-[15px] text-muted-foreground hover:text-primary max-md:rounded-full max-md:text-sm'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
