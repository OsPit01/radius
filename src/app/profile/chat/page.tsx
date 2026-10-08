"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { ChatList } from "@/app/_components/chat/ChatList";
import { ChatWindow } from "@/app/_components/chat/ChatWindow";
import { formatBookingDates, type ChatPerson } from "@/lib/chat";

export default function ChatPage() {
  // ===== Данные текущего пользователя =====
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  // Мои данные (для аватара собственных сообщений). firstName/lastName
  // в сессии нет — используем только name и image.
  const myPerson: ChatPerson = {
    id: userId,
    name: session?.user?.name ?? null,
    firstName: null,
    lastName: null,
    image: session?.user?.image ?? null,
  };

  // ===== Список бесед и выбор активной =====
  const { data: chats } = api.chat.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ===== Сообщения выбранного диалога =====
  const { data: messages } = api.chat.messages.useQuery(
    { conversationId: selectedId ?? 0 },
    { enabled: selectedId !== null },
  );

  const utils = api.useUtils();

  // ===== Счётчик непрочитанных + отметка «прочитано» =====
  const { data: unreadCount } = api.chat.unreadCount.useQuery();
  const markRead = api.chat.markRead.useMutation({
    onSuccess: () => {
      void utils.chat.unreadCount.invalidate();
    },
  });

  // ===== Отправка сообщения =====
  const sendMessage = api.chat.send.useMutation({
    onSuccess: () => {
      void utils.chat.messages.invalidate();
    },
  });

  // ===== Выбранный диалог и его собеседник =====
  const selected = chats?.find((c) => c.conversation.id === selectedId);
  const companion: ChatPerson = selected
    ? selected.conversation.guestId === userId
      ? selected.owner
      : selected.guest
    : null;

  // Открыть диалог: выбираем его и помечаем чужие сообщения прочитанными.
  const handleSelect = (id: number) => {
    setSelectedId(id);
    markRead.mutate({ conversationId: id });
  };

  // Отправить сообщение в текущий диалог.
  const handleSend = (text: string) => {
    if (selectedId === null) return;
    sendMessage.mutate({ conversationId: selectedId, text });
  };

  return (
    <AuthGuard>
      <ClientHeader />
      <div className="mx-auto max-w-2xl px-4 pb-4">
        {selectedId === null ? (
          // ===== СПИСОК БЕСЕД =====
          <div>
            <h1 className="flex items-center gap-2 pt-6 pb-4 text-2xl font-bold text-[#222]">
              Сообщения
              {(unreadCount ?? 0) > 0 && (
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-sm font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </h1>

            {chats?.length === 0 && (
              <p className="py-16 text-center text-[#888]">
                Пока нет ни одного диалога
              </p>
            )}

            {chats && chats.length > 0 && (
              <ChatList chats={chats} userId={userId} onSelect={handleSelect} />
            )}
          </div>
        ) : (
          // ===== ОКНО ЧАТА =====
          <ChatWindow
            apartmentTitle={selected?.apartment.title ?? ""}
            companion={companion}
            bookingDates={
              selected
                ? formatBookingDates(
                    selected.booking.checkInDate,
                    selected.booking.checkOutDate,
                  )
                : ""
            }
            messages={messages ?? []}
            myUserId={userId}
            myPerson={myPerson}
            onBack={() => setSelectedId(null)}
            onSend={handleSend}
            isSending={sendMessage.isPending}
          />
        )}
      </div>
    </AuthGuard>
  );
}
