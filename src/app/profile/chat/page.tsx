"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";

// Полное имя человека из ФИО (или fallback на name).
function displayName(u: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}) {
  if (u.firstName || u.lastName) {
    return [u.firstName, u.lastName].filter(Boolean).join(" ");
  }
  return u.name ?? "Собеседник";
}

export default function ChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const { data: chats } = api.chat.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: messages } = api.chat.message.useQuery(
    { conversationId: selectedId ?? 0 },
    { enabled: selectedId !== null },
  );

  const utils = api.useUtils();
  const [text, setText] = useState("");
  const sendMessage = api.chat.send.useMutation({
    onSuccess: () => {
      void utils.chat.message.invalidate();
      setText("");
    },
  });

  const handleSend = () => {
    if (!text.trim() || selectedId === null) return;
    sendMessage.mutate({ conversationId: selectedId, text: text.trim() });
  };

  const selected = chats?.find((c) => c.conversation.id === selectedId);
  // Собеседник: если я гость — показываем владельца, иначе — гостя.
  const companion = selected
    ? selected.conversation.guestId === userId
      ? selected.owner
      : selected.guest
    : null;

  return (
    <AuthGuard>
      <ClientHeader />
      <div className="mx-auto max-w-2xl px-4 pb-4">
        {selectedId === null ? (
          // ===== СПИСОК ЧАТОВ =====
          <div>
            <h1 className="pt-6 pb-4 text-2xl font-bold text-[#222]">
              Сообщения
            </h1>
            {chats?.length === 0 && (
              <p className="py-16 text-center text-[#888]">
                Пока нет ни одного диалога
              </p>
            )}
            <ul className="flex flex-col">
              {chats?.map((c) => {
                const other =
                  c.conversation.guestId === userId ? c.owner : c.guest;
                return (
                  <li key={c.conversation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.conversation.id)}
                      className="flex w-full items-center gap-3 border-b border-[#eee] px-2 py-3 text-left transition-colors hover:bg-[#fafafa]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f6eefe] text-lg font-bold text-[#6b21a8]">
                        {displayName(other ?? { name: null, firstName: null, lastName: null }).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#222]">
                          {displayName(
                            other ?? { name: null, firstName: null, lastName: null },
                          )}
                        </p>
                        <p className="text-sm text-[#888]">Чат</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          // ===== ОКНО ЧАТА =====
          <div className="flex h-[calc(100vh-140px)] flex-col">
            {/* Заголовок */}
            <div className="flex items-center gap-3 border-b border-[#eee] py-3">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xl text-[#222] transition-colors hover:bg-[#f0f0f0]"
                aria-label="Назад"
              >
                ←
              </button>
              <p className="truncate text-lg font-semibold text-[#222]">
                {displayName(
                  companion ?? { name: null, firstName: null, lastName: null },
                )}
              </p>
            </div>

            {/* Сообщения */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-4">
              {messages?.map((m) => {
                const isMine = m.senderId === userId;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-[15px] ${
                        isMine
                          ? "rounded-br-sm bg-[#6b21a8] text-white"
                          : "rounded-bl-sm bg-[#f0f0f0] text-[#222]"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Поле ввода */}
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
                disabled={!text.trim() || sendMessage.isPending}
                className="shrink-0 cursor-pointer rounded-full bg-[#6b21a8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a1a8f] disabled:cursor-not-allowed disabled:bg-[#c4b5fd]"
              >
                Отправить
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
