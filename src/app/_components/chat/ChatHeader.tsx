"use client";

import { displayName, type ChatPerson } from "@/lib/chat";
import { ArrowLeft } from "lucide-react";
type ChatHeaderProps = {
  /** Название квартиры. */
  apartmentTitle: string;
  /** Собеседник (гость или владелец — кого показываем). */
  companion: ChatPerson;
  /** Диапазон дат брони, например «5 окт. — 7 окт.». */
  bookingDates: string;
  /** Кнопка «назад» к списку бесед. */
  onBack: () => void;
};

/**
 * Шапка окна чата: кнопка «назад», название квартиры,
 * имя собеседника и даты бронирования.
 */
export function ChatHeader({
  apartmentTitle,
  companion,
  bookingDates,
  onBack,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-300 py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl text-[20px] font-semibold text-[#222] transition-colors hover:bg-[#f0f0f0]"
        aria-label="Назад к списку бесед"
      >
        <ArrowLeft className="h-6 w-6" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#222]">{apartmentTitle}</p>
        <p className="truncate text-sm text-[#888]">{displayName(companion)}</p>
      </div>
    </div>
  );
}
