import { useState } from 'react';

import { MAX_BOOKING_GUESTS, MIN_BOOKING_GUESTS } from '@/lib/constants/booking';

type SearchFormProps = {
    onSearchClick: (query: string, guests: number, children: number) => void; // при нажатии на лупу
    onTempQueryChange: (query: string) => void; // при изменении текста
    onTempGuestsChange: (guests: number, children: number) => void;
    onFilterClick: () => void; // открывает попап фильтров (мобилка)
    initialQuery?: string;
    initialGuests?: number;
    isLoading?: boolean;
};

export function SearchForm({
    onSearchClick,
    onTempQueryChange,
    onTempGuestsChange,
    onFilterClick,
    initialQuery = '',
    initialGuests = 1,
}: SearchFormProps) {
    // ===== ВРЕМЕННЫЕ СОСТОЯНИЯ (живут только внутри SearchForm) =====
    const [tempSearchQuery, setTempSearchQuery] = useState(initialQuery);
    const [isGuestWindowOpen, setIsGuestWindowOpen] = useState(false);
    const [tempAdults, setTempAdults] = useState(
        initialGuests > MIN_BOOKING_GUESTS ? initialGuests : MIN_BOOKING_GUESTS,
    );
    const [tempChildren, setTempChildren] = useState(0);
    const [pets, setPets] = useState(0);
    const [childAges, setChildAges] = useState<number[]>([]);

    // ===== ОБНОВЛЕНИЕ ВРЕМЕННЫХ ЗНАЧЕНИЙ =====
    const updateTempQuery = (query: string) => {
        setTempSearchQuery(query);
        onTempQueryChange(query);
    };

    const updateTempGuests = (adults: number, children: number) => {
        const total = adults + children;
        onTempGuestsChange(total, children);
    };

    // ===== УВЕЛИЧЕНИЕ КОЛИЧЕСТВА =====
    const increase = (type: 'adults' | 'children' | 'pets') => {
        if (type === 'adults' && tempAdults < MAX_BOOKING_GUESTS) {
            const newAdults = tempAdults + 1;
            setTempAdults(newAdults);
            updateTempGuests(newAdults, tempChildren);
        }
        if (type === 'children' && tempChildren < MAX_BOOKING_GUESTS) {
            const newChildren = tempChildren + 1;
            setTempChildren(newChildren);
            setChildAges([...childAges, 0]);
            updateTempGuests(tempAdults, newChildren);
        }
        if (type === 'pets' && pets < MAX_BOOKING_GUESTS) {
            setPets(pets + 1);
        }
    };

    // ===== УМЕНЬШЕНИЕ КОЛИЧЕСТВА =====
    const decrease = (type: 'adults' | 'children' | 'pets') => {
        if (type === 'adults' && tempAdults > MIN_BOOKING_GUESTS) {
            const newAdults = tempAdults - 1;
            setTempAdults(newAdults);
            updateTempGuests(newAdults, tempChildren);
        }
        if (type === 'children' && tempChildren > 0) {
            const newChildren = tempChildren - 1;
            setTempChildren(newChildren);
            setChildAges(childAges.slice(0, -1));
            updateTempGuests(tempAdults, newChildren);
        }
        if (type === 'pets' && pets > 0) {
            setPets(pets - 1);
        }
    };

    // ===== ОБРАБОТЧИК ИЗМЕНЕНИЯ ТЕКСТА =====
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        updateTempQuery(newQuery);
    };

    // ===== ОБРАБОТЧИК ЗАКРЫТИЯ ПОПАПА (кнопка "Готово") =====
    const handleGuestWindowClose = () => {
        setIsGuestWindowOpen(false);
        updateTempGuests(tempAdults, tempChildren);
    };

    // ===== ТЕКСТ ДЛЯ КНОПКИ ГОСТЕЙ =====
    const adultsText = tempAdults === 1 ? 'Взрослый' : 'Взрослых';
    const childrenText =
        tempChildren === 0
            ? 'без детей'
            : tempChildren === 1
              ? tempChildren + ' ' + 'ребёнок'
              : tempChildren < 5
                ? tempChildren + ' ' + 'ребёнка'
                : tempChildren + ' ' + 'детей';

    const updateChildAge = (index: number, age: number) => {
        const newAges = [...childAges];
        newAges[index] = age;
        setChildAges(newAges);
    };

    return (
        <div className="mt-[25px] flex w-full justify-center px-3 max-md:mt-4">
            <div className="flex w-full max-w-[900px] items-stretch rounded-2xl border border-border bg-card shadow-[0_4px_16px_rgba(0,0,0,0.06)] max-md:flex-col">
                {/* ===== 1. ПОЛЕ ПОИСКА + ЛУПА ВНУТРИ ===== */}
                <div className="relative flex flex-1 items-center rounded-l-2xl max-md:rounded-t-2xl max-md:rounded-l-none max-md:border-b max-md:border-border">
                    <input
                        type="text"
                        className="w-full bg-transparent py-4 pr-12 pl-5 text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground max-md:py-3"
                        placeholder="Поиск по городу..."
                        value={tempSearchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSearchClick(tempSearchQuery, tempAdults + tempChildren, tempChildren);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => onSearchClick(tempSearchQuery, tempAdults + tempChildren, tempChildren)}
                        aria-label="Поиск"
                        className="absolute right-2.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition-transform duration-200 hover:scale-105 max-md:right-2 max-md:h-8 max-md:w-8"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="8"
                            ></circle>
                            <line
                                x1="21"
                                y1="21"
                                x2="16.65"
                                y2="16.65"
                            ></line>
                        </svg>
                    </button>
                </div>

                {/* ===== 2. КНОПКА ГОСТЕЙ (отдельная секция) ===== */}
                <div className="relative flex items-stretch border-l border-border max-md:border-b max-md:border-l-0 max-md:border-border">
                    <button
                        type="button"
                        onClick={() => setIsGuestWindowOpen(true)}
                        className="flex cursor-pointer items-center gap-2 border-none bg-transparent px-5 py-4 text-sm font-medium whitespace-nowrap text-foreground transition-colors duration-200 hover:bg-muted max-md:w-full max-md:justify-between max-md:py-3.5"
                    >
                        <span>
                            {tempAdults} {adultsText}, {childrenText}
                        </span>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {/* ПОПАП */}
                    {isGuestWindowOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-[1000] bg-transparent max-md:bg-black/40"
                                onClick={() => setIsGuestWindowOpen(false)}
                            />
                            <div className="absolute top-full left-1/2 z-[1001] mt-2 w-[350px] -translate-x-1/2 rounded-2xl border border-border bg-card max-[480px]:w-[95vw] max-[480px]:max-w-[320px] max-md:fixed max-md:top-1/2 max-md:left-1/2 max-md:mt-0 max-md:max-h-[80vh] max-md:w-[90vw] max-md:max-w-[380px] max-md:-translate-x-1/2 max-md:-translate-y-1/2 max-md:overflow-y-auto">
                                <h3 className="m-2.5 border-b border-border pb-2.5 text-sm font-normal max-[480px]:m-2 max-[480px]:text-[13px]">
                                    кто едет?
                                </h3>

                                {/* ВЗРОСЛЫЕ */}
                                <div className="flex items-center justify-between border-b border-border p-2.5 max-[480px]:p-2">
                                    <span className="font-medium">Взрослые от 18 лет</span>
                                    <div className="flex items-center text-[22px]">
                                        <button
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-muted p-0 text-[22px] max-[480px]:h-6 max-[480px]:w-6 max-[480px]:text-base max-md:h-7 max-md:w-7 max-md:text-lg"
                                            onClick={() => decrease('adults')}
                                            disabled={tempAdults <= MIN_BOOKING_GUESTS}
                                        >
                                            -
                                        </button>
                                        <span className="p-[15px] max-[480px]:px-2.5 max-[480px]:py-1.5 max-[480px]:text-sm max-md:px-3.5 max-md:py-2 max-md:text-base">
                                            {tempAdults}
                                        </span>
                                        <button
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-muted p-0 text-[22px] max-[480px]:h-6 max-[480px]:w-6 max-[480px]:text-base max-md:h-7 max-md:w-7 max-md:text-lg"
                                            onClick={() => increase('adults')}
                                            disabled={tempAdults >= MAX_BOOKING_GUESTS}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* ДЕТИ */}
                                <div className="flex items-center justify-between border-b border-border p-2.5 max-[480px]:p-2">
                                    <span className="font-medium">Дети</span>
                                    <div className="flex items-center text-[22px]">
                                        <button
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-muted p-0 text-[22px] max-[480px]:h-6 max-[480px]:w-6 max-[480px]:text-base max-md:h-7 max-md:w-7 max-md:text-lg"
                                            onClick={() => decrease('children')}
                                            disabled={tempChildren <= 0}
                                        >
                                            -
                                        </button>
                                        <span className="p-[15px] max-[480px]:px-2.5 max-[480px]:py-1.5 max-[480px]:text-sm max-md:px-3.5 max-md:py-2 max-md:text-base">
                                            {tempChildren}
                                        </span>
                                        <button
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-muted p-0 text-[22px] max-[480px]:h-6 max-[480px]:w-6 max-[480px]:text-base max-md:h-7 max-md:w-7 max-md:text-lg"
                                            onClick={() => increase('children')}
                                            disabled={tempChildren >= MAX_BOOKING_GUESTS}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* ВОЗРАСТ ДЕТЕЙ */}
                                {tempChildren > 0 && (
                                    <div className="m-2.5 rounded-xl bg-muted p-[22px]">
                                        <div className="mb-2.5 border-b border-border pb-[5px] text-[13px] font-medium text-muted-foreground">
                                            Возраст детей:
                                        </div>
                                        {childAges.map((age, index) => (
                                            <div
                                                key={index}
                                                className="mb-2.5 flex items-center justify-between py-[5px]"
                                            >
                                                <span>Ребёнок {index + 1}</span>
                                                <select
                                                    className="cursor-pointer rounded-[25px] border border-border bg-card px-[15px] py-2.5 text-sm outline-none focus:border-primary"
                                                    value={age}
                                                    onChange={(e) => updateChildAge(index, Number(e.target.value))}
                                                >
                                                    {[...Array(18).keys()].map((ageNum) => (
                                                        <option
                                                            key={ageNum}
                                                            value={ageNum}
                                                        >
                                                            {ageNum} {getAgeText(ageNum)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* КНОПКА ГОТОВО */}
                                <button
                                    className="m-[15px] h-[50px] w-[70%] rounded-[15px] bg-foreground text-lg text-background hover:bg-foreground/85 max-[480px]:mx-auto max-[480px]:my-2.5 max-[480px]:h-10 max-[480px]:w-[92%] max-[480px]:text-sm max-md:mx-auto max-md:my-3 max-md:block max-md:h-11 max-md:w-[85%] max-md:text-[15px]"
                                    onClick={handleGuestWindowClose}
                                >
                                    Готово
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* ===== 3. КНОПКА ФИЛЬТРА (отдельная секция) ===== */}
                <button
                    type="button"
                    onClick={onFilterClick}
                    className="flex cursor-pointer items-center gap-2 rounded-r-2xl border-l border-border bg-transparent px-5 py-4 text-sm font-medium whitespace-nowrap text-foreground transition-colors duration-200 hover:bg-muted max-md:w-full max-md:justify-center max-md:rounded-r-none max-md:rounded-b-2xl max-md:border-l-0 max-md:py-3.5"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                    >
                        <line
                            x1="4"
                            y1="6"
                            x2="20"
                            y2="6"
                        />
                        <line
                            x1="7"
                            y1="12"
                            x2="17"
                            y2="12"
                        />
                        <line
                            x1="10"
                            y1="18"
                            x2="14"
                            y2="18"
                        />
                    </svg>
                    <span>Фильтр</span>
                </button>
            </div>
        </div>
    );
}

function getAgeText(age: number): string {
    if (age % 10 === 1 && age % 100 !== 11) {
        return 'год';
    }
    if (age % 10 >= 2 && age % 10 <= 4 && (age % 100 < 10 || age % 100 >= 20)) {
        return 'года';
    }
    return 'лет';
}
