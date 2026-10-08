"use client";

import Image from "next/image";
import { avatarInitial, displayName, formatChatDate, type ChatPerson } from "@/lib/chat";

type MessageBubbleProps = {
  /** Текст сообщения. */
  text: string;
  /** true — сообщение написал я (пузырь справа), иначе слева. */
  isMine: boolean;
  /** Кто отправил (для аватара и подписи имени). */
  sender: ChatPerson;
  /** Когда отправлено. */
  createdAt: Date;
};

/**
 * Один пузырь сообщения с аватаром отправителя.
 * Мои — справа (пурпурные), чужие — слева (серые).
 */
export function MessageBubble({
  text,
  isMine,
  sender,
  createdAt,
}: MessageBubbleProps) {
  // Аватар: фото пользователя или кружок с первой буквой имени.
  const avatar =
    sender?.image ? (
      <Image
        src={sender.image}
        alt={displayName(sender)}
        width={32}
        height={32}
        unoptimized
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    ) : (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9e0f0] text-sm font-bold text-[#6b21a8]">
        {avatarInitial(sender)}
      </div>
    );

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
      {avatar}

      <div className="flex max-w-[70%] flex-col">
        {/* Имя отправителя (видно только у чужих, чтобы отличать в групповой переписке) */}
        {!isMine && (
          <span className="mb-0.5 px-1 text-xs text-[#888]">
            {displayName(sender)}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2 text-[15px] ${
            isMine
              ? "rounded-br-sm bg-[#6b21a8] text-white"
              : "rounded-bl-sm bg-[#f0f0f0] text-[#222]"
          }`}
        >
          {text}
        </div>

        <span className="mt-0.5 px-1 text-[11px] text-[#aaa]">
          {formatChatDate(createdAt)}
        </span>
      </div>
    </div>
  );
}
