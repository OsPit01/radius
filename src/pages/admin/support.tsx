import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { ChatTextarea } from '@/components/chat/ChatTextarea';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ArrowLeft, Eye, Send } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { formatChatDate } from '@/lib/chat';
import { getRoleInfo, isAdminRole } from '@/lib/constants/roles';
import { SUPPORT_TEMPLATES } from '@/lib/constants/support-templates';
import { getRoleColor } from '@/lib/theme';
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

    // Чей id раскрыт полностью (глаз в карточке заявки): null — все свёрнуты.
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferTo, setTransferTo] = useState('');
    const messagesRef = useRef<HTMLDivElement>(null);
    // ===== Сообщения ВЫБРАННОЙ заявки =====
    // enabled: пока чат не открыт — запрос на сервер вообще не уходит.
    const { data: messages } = api.support.messages.useQuery(
        { id: selectedId ?? 0 },
        { enabled: selectedId !== null, refetchInterval: 5000 },
    );
    // Автопрокрутка вниз: при открытии заявки и при новых сообщениях
    // показываем последнее.
    useEffect(() => {
        const el = messagesRef.current;
        if (!el) {
            return;
        }
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [selectedId, messages?.length]);
    // ===== Ответ админа =====
    const utils = api.useUtils();
    const [text, setText] = useState('');
    // Ссылка на ленту сообщений — для автопрокрутки вниз.

    const sendMessage = api.support.send.useMutation({
        // После успешной отправки — «кэш устарел, перезабери»,
        // чтобы ответ появился мгновенно, а не через 5 секунд.
        onSuccess: () => void utils.support.messages.invalidate(),
    });
    const markRead = api.support.markRead.useMutation({ onSuccess: () => void utils.support.listAll.invalidate() });
    const takeTicket = api.support.assign.useMutation({
        onSuccess: () => void utils.support.listAll.invalidate(),
    });
    const leaveTicket = api.support.leave.useMutation({
        onSuccess: () => void utils.support.listAll.invalidate(),
    });
    // Список админов — лениво: только когда открыта какая-то заявка.
    const { data: admins } = api.support.admins.useQuery(undefined, { enabled: selectedId !== null });
    const transfer = api.support.transfer.useMutation({
        onSuccess: () => {
            setTransferOpen(false);
            setTransferTo('');
            void utils.support.listAll.invalidate();
        },
    });
    // Отправить ответ: guard'ы — пустой текст, «чат не открыт» и «уже отправляем»
    // (третий защищает от дубля при Enter + быстрых кликах).
    const handleSend = async () => {
        if (!text.trim() || selectedId === null) {
            return;
        }
        if (sendMessage.isPending) {
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
    // Данные выбранной заявки (для «Ведёт: Имя» и кнопок взять/выйти)
    const selected = tickets?.find((t) => t.id === selectedId) ?? null;
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
                                <div
                                    key={item.id}
                                    // Карточка-обёртка: рамка, паддинг и ховер живут здесь.
                                    className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
                                >
                                    {/* Кликабельная часть: открывает переписку.
                                        Ссылка на профиль — ОТДЕЛЬНЫМ элементом ниже:
                                        вкладывать Link внутрь button нельзя
                                        (два интерактивных элемента друг в друге = невалидный HTML). */}
                                    <button
                                        type="button"
                                        className="flex w-full cursor-pointer flex-col text-left"
                                        onClick={() => {
                                            setSelectedId(item.id);
                                            markRead.mutate({ id: item.id });
                                        }}
                                    >
                                        <span className="text-sm font-semibold">Заявка #{item.id}</span>
                                        {item.unreadCount > 0 && (
                                            // self-start: бейдж не растягивается на всю ширину кнопки
                                            <span className="mt-1 self-start rounded-full bg-destructive px-2.5 py-0.5 text-sm font-semibold text-destructive-foreground">
                                                {item.unreadCount}
                                            </span>
                                        )}
                                        <span className="mt-1 text-sm text-muted-foreground">
                                            Статус: {item.status} — {formatChatDate(item.createdAt)}
                                        </span>
                                    </button>

                                    {/* Кто пишет обращение: АВАТАРКА (клик = перейти
                                        к профилю пользователя) + email и id рядом.
                                        Аватар — переиспользуемый Avatar проекта:
                                        фото или буква-заглушка, если фото нет. */}
                                    {item.owner && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <Link
                                                href={`/admin/users?query=${item.owner.id}`}
                                                aria-label="Открыть профиль пользователя"
                                                // shrink-0: аватар не сжимается, текст переносится
                                                className="shrink-0 rounded-full transition-opacity hover:opacity-80"
                                            >
                                                <Avatar
                                                    src={item.owner.image}
                                                    name={item.owner.name ?? item.owner.email ?? 'Пользователь'}
                                                    fallbackText={(item.owner.name ?? item.owner.email ?? 'П')
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                    size={32}
                                                />
                                            </Link>
                                            {/* Email — крупно и чётко (текст основного цвета),
                                                id — приглушённо. break-all — длинный email
                                                переносится и НЕ распирает карточку. */}
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-sm font-medium break-all text-foreground">
                                                    {item.owner.email ?? '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span
                                                        className="text-xs text-muted-foreground"
                                                        title={item.owner.id}
                                                    >
                                                        ID:{' '}
                                                        {expandedId === item.id
                                                            ? item.owner.id
                                                            : `${item.owner.id.slice(0, 8)}…`}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedId(expandedId === item.id ? null : item.id)
                                                        }
                                                        aria-label={
                                                            expandedId === item.id ? 'Скрыть ID' : 'Показать ID'
                                                        }
                                                        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Шапка окна: назад + номер заявки + кто ведёт. */}
                        <div className="flex flex-wrap items-center gap-3 border-b pb-4">
                            <button
                                type="button"
                                // «Назад»: сбрасываем выбор → снова список.
                                // Кнопка повыше — чтобы удобно жать пальцем на мобилке.
                                className="flex h-11 cursor-pointer items-center rounded-lg px-3 text-sm hover:bg-muted"
                                onClick={() => setSelectedId(null)}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            {/* ===== КТО ВЕДЁТ + кнопки «Взять/Выйти/Передать» ===== */}
                            {selected?.assignedAdmin ? (
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    Ведёт:
                                    <span className="font-medium text-foreground">
                                        {selected.assignedAdmin.name ?? 'Админ'}
                                    </span>
                                    {/* Статус ведущего: цвет — из слоя оформления
                                        (getRoleColor, см. lib/theme.ts), текст роли — из
                                        домена (getRoleInfo). Динамический цвет → style,
                                        не Tailwind (Tailwind не собирает классы из переменных). */}
                                    <span
                                        style={{ background: getRoleColor(selected.assignedAdmin.role) }}
                                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase"
                                    >
                                        {getRoleInfo(selected.assignedAdmin.role).label}
                                    </span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    // «Взять себе» = процедура assign (переиспользование:
                                    // assign и есть «назначить меня ведущим»)
                                    onClick={() => selectedId !== null && takeTicket.mutate({ id: selectedId })}
                                    className="h-11 cursor-pointer rounded-[30px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Участвовать
                                </button>
                            )}
                            {/* «Выйти» видит только тот, кто ведёт эту заявку */}
                            {selected?.assignedAdmin?.id === myId && selectedId !== null && (
                                <button
                                    type="button"
                                    onClick={() => leaveTicket.mutate({ id: selectedId })}
                                    className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                                >
                                    Выйти
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setTransferOpen(true)}
                                className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            >
                                Передать
                            </button>
                        </div>

                        {/* Переписка выбранной заявки (прокрутка, если сообщений много). */}
                        <div
                            ref={messagesRef}
                            className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-2"
                        >
                            {messages?.map((m) => (
                                <MessageBubble
                                    key={m.message.id}
                                    text={m.message.text}
                                    // Моё сообщение — справа, юзера — слева.
                                    isMine={m.message.senderId === myId}
                                    // У сообщения поддержки пока знаем только senderId (без имени/аватара).
                                    sender={m.sender}
                                    createdAt={m.message.createdAt}
                                />
                            ))}
                        </div>

                        {/* Подсказки-шаблоны: клик — текст летит в поле ввода.
                            flex-wrap — на мобилке чипы переносятся на новые строки. */}
                        <div className="flex flex-wrap gap-2 pb-2">
                            {SUPPORT_TEMPLATES.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setText(s.text)}
                                    className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Поле ввода + кнопка отправки.
                            ChatTextarea — переиспользуемое поле с лимитом 500,
                            авторостом и счётчиком символов. */}
                        <div className="mt-4 flex items-end gap-2 border-t pt-4">
                            <ChatTextarea
                                value={text}
                                onChange={setText}
                                placeholder="Ответ пользователю..."
                                // Enter — отправить (Shift+Enter — новая строка)
                                onSend={handleSend}
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                aria-label="Отправить"
                                // shrink-0: кнопка не сжимается, textarea забирает всю ширину.
                                className="mb-6 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Send className="h-6 w-6" />
                            </button>
                            <Modal
                                open={transferOpen}
                                onClose={() => setTransferOpen(false)}
                                title="Передать обращение"
                            >
                                <div className="flex flex-col gap-3">
                                    <select
                                        value={transferTo}
                                        onChange={(e) => setTransferTo(e.target.value)}
                                        className="w-full cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                    >
                                        <option value="">Выберите админа...</option>
                                        {admins
                                            ?.filter((a) => a.id !== myId)
                                            .map((a) => (
                                                <option
                                                    key={a.id}
                                                    value={a.id}
                                                >
                                                    {a.name ?? a.email}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            selectedId !== null &&
                                            transfer.mutate({ id: selectedId, adminId: transferTo })
                                        }
                                        disabled={!transferTo || transfer.isPending}
                                        className="mt-2 cursor-pointer rounded-[30px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {transfer.isPending ? 'Передаём...' : 'Передать'}
                                    </button>
                                </div>
                            </Modal>
                        </div>
                    </>
                )}
            </div>
        </AuthGuard>
    );
}
