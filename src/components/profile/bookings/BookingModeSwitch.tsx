type ModeSwitchProps<T extends string> = {
    tabs: readonly { id: T; label: string }[];
    active: T;
    onChange: (id: T) => void;
};

/**
 * Переключатель режима «Сдаю / Снимаю» — сегментный контрол:
 * две равные кнопки на подложке, активная подсвечена. Визуально
 * отличается от вкладок статусов (BookingTabs), чтобы было понятно,
 * что это именно выбор режима, а не фильтр по статусам.
 */
export function ModeSwitch<T extends string>({ tabs, active, onChange }: ModeSwitchProps<T>) {
    return (
        <div className="inline-flex w-full p-1 pb-10 tracking-widest">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`ml-2 flex-1 cursor-pointer px-4 py-4 text-sm font-semibold whitespace-nowrap active:scale-95 ${
                        active === tab.id
                            ? 'border-b-2 border-primary text-[25px] text-primary'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
