"use client";

import { useEffect, useRef, useState } from "react";
import type { RouterOutputs } from "@/trpc/react";
import type { ChatPerson } from "@/lib/chat";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";

type ChatWindowProps = {
  /** Название квартиры (для шапки). */
  apartmentTitle: string;
  /** Собеседник (для шапки и аватара чужих сообщений). */
  companion: ChatPerson;
  /** Диапазон дат брони. */
  bookingDates: string;
  /** Все сообщения диалога. */
  messages: RouterOutputs["chat"]["messages"];
  /** Мой id — чтобы отличать свои сообщения от чужих. */
  myUserId: string;
  /** Мои данные (для аватара моих сообщений). */
  myPerson: ChatPerson;
  /** Вернуться к списку бесед. */
  onBack: () => void;
  /** Отправить сообщение (текст уже без пробелов по краям). */
  onSend: (text: string) => void;
  /** Идёт ли отправка прямо сейчас (для блокировки кнопки). */
  isSending: boolean;
};

/**
 * Окно переписки: шапка с деталями брони, лента сообщений (пузыри)
 * и поле ввода снизу. Поле ввода и текст хранятся ЛОКАЛЬНО здесь,
 * чтобы родитель (страница) не знал о внутреннем состоянии ввода.
 */
export function ChatWindow({
  apartmentTitle,
  companion,
  bookingDates,
  messages,
  myUserId,
  myPerson,
  onBack,
  onSend,
  isSending,
}: ChatWindowProps) {
  // Текст в поле ввода — локальное состояние окна чата.
  const [text, setText] = useState("");
  // Ссылка на нижнюю точку ленты — для автопрокрутки вниз.
  const bottomRef = useRef<HTMLDivElement>(null);

  // При появлении новых сообщений прокручиваем ленту вниз.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Отправка: чистим текст сразу, а сам запрос делает родитель.
  const handleSend = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      {/* Шапка с деталями бронирования */}
      <ChatHeader
        apartmentTitle={apartmentTitle}
        companion={companion}
        bookingDates={bookingDates}
        onBack={onBack}
      />

      {/* Лента сообщений */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-4">
        {messages?.length === 0 && (
          <p className="py-8 text-center text-[#888]">Нет сообщений.</p>
        )}
        {messages?.map((m) => {
          const isMine = m.senderId === myUserId;
          return (
            <MessageBubble
              key={m.id}
              text={m.text}
              isMine={isMine}
              sender={isMine ? myPerson : companion}
              createdAt={m.createdAt}
            />
          );
        })}
        {/* Невидимая точка внизу — к ней скроллим при новом сообщении. */}
        <div ref={bottomRef} />
      </div>

      {/* Поле ввода + кнопка отправки */}
      <div className="flex gap-2 border-t border-[#eee] pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Сообщение..."
          className="min-w-0 flex-1 rounded-full border border-[#e0e0e0] px-4 py-2.5 text-[15px] text-[#222] outline-none focus:border-[#6b21a8]"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="shrink-0 cursor-pointer rounded-full bg-[#6b21a8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a1a8f] disabled:cursor-not-allowed disabled:bg-[#c4b5fd]"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
