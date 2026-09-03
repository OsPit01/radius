"use client";

import { useState, useRef, useEffect } from "react";

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
  placeholder = "Выберите...",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Закрывать по клику вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-[#2a1a3a] bg-[#1a0a2a] px-4 py-3 text-base text-white outline-none transition-all duration-300 hover:border-[#3a2a4a] focus:border-[#6b21a8] focus:shadow-[0_0_0_3px_rgba(107,33,168,0.2)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span
          className={`ml-2 text-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] max-h-[200px] overflow-hidden overflow-y-auto rounded-xl border-2 border-[#2a1a3a] bg-[#1a0a2a]">
          {options.map((option) => (
            <div
              key={option.value}
              className={`cursor-pointer px-4 py-3 text-base text-white transition-colors duration-200 hover:bg-[rgba(107,33,168,0.2)] ${
                option.value === value
                  ? "bg-[rgba(107,33,168,0.3)] text-white"
                  : ""
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
