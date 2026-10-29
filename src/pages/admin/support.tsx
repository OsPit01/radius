import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { Send } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { formatChatDate } from '@/lib/chat';
import { isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных разворачивает на вход ещё на сервере.
export const getServerSideProps = requireAuth;

export default function SupportPage() {
    // ===== Данные =====
    const { data: session } = useSession();
    // Мой id — чтобы отличать свои сообщения от сообщений юзера.
    // ?. — «если сессии нет, не падай», ?? — дефолт-пустышка.
    const myId = session?.user?.id ?? '';

    // ===== ВСЕ хуки — ДО early return (правило хуков: порядок вызовов
    // не должен зависеть от условий, иначе React падает при смене сессии) =====
    const { data: tickets } = api.support.listAll.useQuery(undefined, { refetchInterval: 5000 });

    // Выбранная заявка: null — показываем список, число — открыта переписка.
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // ===== Сообщения ВЫБРАННОЙ заявки =====
    // enabled: пока чат не открыт — запрос на сервер вообще не уходит.
    const { data: messages } = api.support.messages.useQuery(
        { id: selectedId ?? 0 },
        { enabled: selectedId !== null, refetchInterval: 5000 },
    );

    // ===== Ответ админа =====
    const utils = api.useUtils();
    const [text, setText] = useState('');
    const sendMessage = api.support.send.useMutation({
        // После успешной отправки — «кэш устарел, перезабери»,
        // чтобы ответ появился мгновенно, а не через 5 секунд.
        onSuccess: () => void utils.support.messages.invalidate(),
    });
    const markRead = api.support.markRead.useMutation({ onSuccess: () => void utils.support.listAll.invalidate() });

    // Отправить ответ: два guard'а — пустой текст и «чат не открыт».
    const handleSend = async () => {
        if (!text.trim() || selectedId === null) {
            return;
        }
        await sendMessage.mutateAsync({ id: selectedId, text: text.trim() });
        setText('');
    };

    // ===== Не админ — заглушка (проверка ПОСЛЕ всех хуков) =====
    if (!isAdminRole(session?.user?.role)) {
        return (
            <AuthGuard>
                <ClientHeader />
                <div>Нет доступа</div>
            </AuthGuard>
        );
    }

    // ===== Экран =====
    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1200px] px-4 py-10">
                {/* ТЕРНАРНИК: список ↔ окно переписки. Один источник правды — selectedId. */}
                {selectedId === null ? (
                    <>
                        <h1 className="pb-2 text-[25px] max-md:text-xl">Обращения в поддержку</h1>
                        <p className="pb-6 text-sm text-muted-foreground">Заявки пользователей: переписка и ответы.</p>

                        {/* Грид карточек: 3 в ряд на десктопе → 2 на планшете → 1 на мобилке
                            (каноничный паттерн проекта, как в admin/conversations.tsx). */}
                        <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                            {/* Карточка-заявка: клик = открыть её переписку. */}
                            {tickets?.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    // w-full — «займи свою ячейку грида» (не всю страницу).
                                    // mb-0: отступы между карточками делает gap-6 грида.
                                    className="flex w-full cursor-pointer flex-col rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
                                    onClick={() => {
                                        setSelectedId(item.id);
                                        markRead.mutate({ id: item.id });
                                    }}
                                >
                                    <span className="font-semibold">Заявка #{item.id}</span>
                                    {item.unreadCount > 0 && (
                                        <span className="rounded-full bg-destructive px-2.5 py-0.5 text-sm font-semibold text-destructive-foreground">
                                            {item.unreadCount}
                                        </span>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        Статус: {item.status} — {formatChatDate(item.createdAt)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Шапка окна: назад + номер заявки. */}
                        <div className="flex items-center gap-3 pb-4">
                            <button
                                type="button"
                                // «Назад»: сбрасываем выбор → снова список.
                                // Кнопка повыше — чтобы удобно жать пальцем на мобилке.
                                className="flex h-11 cursor-pointer items-center rounded-lg px-3 text-sm hover:bg-muted"
                                onClick={() => setSelectedId(null)}
                            >
                                ← Назад
                            </button>
                            <h1 className="text-[25px] max-md:text-xl">Заявка #{selectedId}</h1>
                        </div>

                        {/* Переписка выбранной заявки (прокрутка, если сообщений много). */}
                        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-2">
                            {messages?.map((m) => (
                                <MessageBubble
                                    key={m.id}
                                    text={m.text}
                                    // Моё сообщение — справа, юзера — слева.
                                    isMine={m.senderId === myId}
                                    // У сообщения поддержки пока знаем только senderId (без имени/аватара).
                                    sender={null}
                                    createdAt={m.createdAt}
                                />
                            ))}
                        </div>

                        {/* Поле ввода + кнопка отправки. */}
                        <div className="mt-4 flex gap-2 border-t pt-4">
                            <textarea
                                className="w-full resize-none rounded-xl border border-border bg-transparent p-3 outline-none focus:border-primary"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Ответ пользователю..."
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                aria-label="Отправить"
                                // shrink-0: кнопка не сжимается, textarea забирает всю ширину.
                                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Send className="h-6 w-6" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </AuthGuard>
    );
}
