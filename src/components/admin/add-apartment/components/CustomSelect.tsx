import { useEffect, useRef, useState } from 'react';

import { ChevronDown } from '@/components/icons';

type Option = {
    value: string;
    label: string;
};

type CustomSelectProps = {
    options: readonly Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Выберите...',
    className = '',
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Закрывать по клику вне
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className={`relative w-full ${className}`}
            ref={dropdownRef}
        >
            <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-border bg-background px-4 py-3 text-base text-foreground transition-all duration-300 outline-none hover:border-muted-foreground/50 focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption?.label ?? placeholder}</span>
                <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-[100] max-h-[200px] overflow-hidden overflow-y-auto rounded-xl border-2 border-border bg-card shadow-lg">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`cursor-pointer px-4 py-3 text-base text-foreground transition-colors duration-200 hover:bg-primary/20 ${
                                option.value === value ? 'bg-primary/30 text-foreground' : ''
                            }`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
