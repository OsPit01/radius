import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { type ChatPerson } from '@/lib/chat';
import { isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function ChatPage() {
    // ===== Данные текущего пользователя =====
    const { data: session } = useSession();
    const userId = session?.user?.id ?? '';
    const isAdmin = isAdminRole(session?.user?.role);
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
    const { data: chats } = api.chat.list.useQuery(undefined, {
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // ===== Сообщения выбранного диалога =====
    const { data: messages } = api.chat.messages.useQuery(
        { conversationId: selectedId ?? 0 },
        { enabled: selectedId !== null },
    );

    const utils = api.useUtils();

    // ===== Счётчик непрочитанных + отметка «прочитано» =====
    const { data: unreadCount } = api.chat.unreadCount.useQuery(undefined, {
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });
    const markRead = api.chat.markRead.useMutation({
        onSuccess: () => {
            void utils.chat.unreadCount.invalidate();
            void utils.chat.list.invalidate();
        },
    });

    // ===== Отправка сообщения =====
    const sendMessage = api.chat.send.useMutation({
        onSuccess: () => {
            void utils.chat.messages.invalidate();
            void utils.chat.list.invalidate();
            void utils.chat.unreadCount.invalidate();
        },
    });

    // ===== Удаление (только админ) =====
    const deleteMessage = api.chat.deleteMessage.useMutation({
        onSuccess: () => {
            void utils.chat.messages.invalidate();
            void utils.chat.list.invalidate();
        },
    });
    const deleteConversation = api.chat.deleteConversation.useMutation({
        onSuccess: () => {
            setSelectedId(null);
            void utils.chat.list.invalidate();
            void utils.chat.unreadCount.invalidate();
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
        if (selectedId === null) {
            return;
        }
        sendMessage.mutate({ conversationId: selectedId, text });
    };

    // Удалить одно сообщение (админ).
    const handleDeleteMessage = (messageId: number) => {
        deleteMessage.mutate({ messageId });
    };

    // Удалить беседу целиком (админ).
    const handleDeleteConversation = () => {
        if (selectedId === null) {
            return;
        }
        deleteConversation.mutate({ conversationId: selectedId });
    };

    // ===== Блок списка бесед (общий для мобилки и десктопа) =====
    const listView = (
        <div>
            <h1 className="flex items-center gap-2 pt-6 pb-4 text-2xl font-bold text-foreground">
                Мои сообщения
                {(unreadCount ?? 0) > 0 && (
                    <span className="rounded-full bg-destructive px-2.5 py-0.5 text-sm font-semibold text-destructive-foreground">
                        {unreadCount}
                    </span>
                )}
            </h1>

            {chats?.length === 0 && (
                <p className="py-16 text-center text-muted-foreground">Пока нет ни одного диалога</p>
            )}

            {chats && chats.length > 0 && (
                <ChatList
                    chats={chats}
                    userId={userId}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                />
            )}
        </div>
    );

    // ===== Блок окна чата (или заглушка «выберите чат») =====
    const chatView =
        selectedId === null ? (
            <div className="flex h-[calc(100vh-140px)] items-center justify-center text-muted-foreground">
                Выберите чат, чтобы начать переписку
            </div>
        ) : (
            <ChatWindow
                fullAddress={selected?.apartment.formattedAddress ?? ''}
                companion={companion}
                messages={messages ?? []}
                myUserId={userId}
                myPerson={myPerson}
                onBack={() => setSelectedId(null)}
                onSend={handleSend}
                isSending={sendMessage.isPending}
                isAdmin={isAdmin}
                conversationActive={selected?.conversation.isActive !== false}
                onDeleteMessage={handleDeleteMessage}
                onDeleteConversation={handleDeleteConversation}
            />
        );

    return (
        <AuthGuard>
            <ClientHeader />
            {/* Общая обёртка: занимает экран минус хедер, без скролла страницы */}
            <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
                {/* ===== МОБИЛКА: одна колонка, переключение список ↔ чат ===== */}
                <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-4 pb-4 md:hidden">
                    {selectedId === null ? listView : chatView}
                </div>

                {/* ДЕСКТОП */}
                <div className="mx-auto hidden w-full max-w-6xl flex-1 overflow-hidden px-4 pb-4 md:flex">
                    <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-border pr-4">
                        {listView}
                    </aside>
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pl-4">{chatView}</div>
                </div>
            </div>
        </AuthGuard>
    );
}
