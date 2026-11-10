import { useEffect, useRef, useState } from 'react';

import { ChatTextarea } from '@/components/chat/ChatTextarea';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ArrowLeft, Send } from '@/components/icons';
import { getRoleInfo } from '@/lib/constants/roles';
import { SUPPORT_TEMPLATES } from '@/lib/constants/support-templates';
import { getRoleColor } from '@/lib/theme';
import type { RouterOutputs } from '@/trpc/react';

import type { SupportTicket } from './TicketCard';

type SupportChatProps = {
    selectedId: number;
    selected: SupportTicket | null;
    myId: string;
    messages: RouterOutputs['support']['messages'] | undefined;
    text: string;
    onChangeText: (value: string) => void;
    onBack: () => void;
    onTake: () => void;
    onLeave: () => void;
    onSend: () => void;
    onOpenTransfer: () => void;
    onClose: () => void;
    /** Может ли удалять обращения: только superadmin/mainadmin. */
    canDelete: boolean;
    /** Удалить заявку вместе со ВСЕМИ сообщениями (после подтверждения). */
    onDelete: () => void;
};

export function SupportChat({
    selectedId,
    selected,
    myId,
    messages,
    text,
    onChangeText,
    onBack,
    onTake,
    onLeave,
    onSend,
    onOpenTransfer,
    onClose,
    canDelete,
    onDelete,
}: SupportChatProps) {
    // Автопрокрутка вниз: при открытии заявки и при новых сообщениях.
    const messagesRef = useRef<HTMLDivElement>(null);

    // Двухшаговое удаление: первый клик «Удалить» → кнопка превращается
    // в «Точно удалить?», второй клик — реальное удаление. Защита от
    // случайного клика: заявку со всей перепиской не вернуть.
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Заявка закрыта: переписка закончена, поле и кнопки действий не нужны.
    const isClosed = selected?.status === 'closed';

    // Заявку ведёт другой админ: смотреть можно, отвечать нельзя.
    const ledByOther = Boolean(selected?.assignedAdmin) && selected?.assignedAdmin?.id !== myId;

    // Действовать может: не закрыта И не ведёт другой админ.
    const canAct = !isClosed && !ledByOther;

    useEffect(() => {
        const el = messagesRef.current;
        if (!el) {
            return;
        }
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [selectedId, messages?.length]);

    return (
        <>
            {/* Шапка окна: назад + номер заявки + кто ведёт + кнопки действий. */}
            <div className="flex flex-wrap items-center gap-3 border-b pb-4">
                <button
                    type="button"
                    className="flex h-11 cursor-pointer items-center rounded-lg px-3 text-sm hover:bg-muted"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>

                {/* Номер заявки: маленький жирный, прижат к левому краю. */}
                <span className="text-sm font-bold">Заявка #{selectedId}</span>

                {/* Закрытую заявку помечаем бейджем — сразу видно, что она решена. */}
                {isClosed && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        Закрыта
                    </span>
                )}

                {/* Ведёт: имя + бейдж роли. */}
                {selected?.assignedAdmin ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        Ведёт:
                        <span className="font-medium text-foreground">{selected.assignedAdmin.name ?? 'Админ'}</span>
                        <span
                            style={{ background: getRoleColor(selected.assignedAdmin.role) }}
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase"
                        >
                            {getRoleInfo(selected.assignedAdmin.role).label}
                        </span>
                    </span>
                ) : (
                    // Закрытую заявку в работу уже не взять — кнопка не нужна.
                    !isClosed && (
                        <button
                            type="button"
                            onClick={onTake}
                            className="h-11 cursor-pointer rounded-[30px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Участвовать
                        </button>
                    )
                )}

                {/* «Выйти» видит только тот, кто ведёт эту заявку (и она открыта). */}
                {!isClosed && selected?.assignedAdmin?.id === myId && (
                    <button
                        type="button"
                        onClick={onLeave}
                        className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                        Выйти
                    </button>
                )}

                {/* «Закрыть» — финальное действие: решает заявку. Доступно тому,
                    кто может действовать (ведёт её или никто не ведёт). */}
                {canAct && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                        Закрыть
                    </button>
                )}

                {/* Закрытую заявку передавать бессмысленно — кнопку прячем. */}
                {!isClosed && (
                    <button
                        type="button"
                        onClick={onOpenTransfer}
                        className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        Передать
                    </button>
                )}

                {/* Удаление — только superadmin/mainadmin. Двухшаговое:
                    первый клик включает подтверждение, второй удаляет
                    заявку со ВСЕЙ перепиской (безвозвратно). */}
                {canDelete &&
                    (confirmDelete ? (
                        <button
                            type="button"
                            onClick={() => {
                                onDelete();
                                setConfirmDelete(false);
                            }}
                            className="h-11 cursor-pointer rounded-[30px] bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
                        >
                            Точно удалить?
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                        >
                            Удалить
                        </button>
                    ))}
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
                        isMine={m.message.senderId === myId}
                        sender={m.sender}
                        createdAt={m.message.createdAt}
                    />
                ))}
            </div>

            {/* Подсказки-шаблоны: клик — текст летит в поле ввода.
                Действовать нельзя — шаблоны не нужны (текст всё равно не уйдёт). */}
            {canAct && (
                <div className="flex flex-wrap gap-2 pb-2">
                    {SUPPORT_TEMPLATES.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onChangeText(s.text)}
                            className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Пометка, почему писать нельзя: заявка закрыта или её ведёт другой админ. */}
            {isClosed ? (
                <p className="pt-3 text-sm text-muted-foreground">
                    Обращение закрыто. Новое обращение пользователь создаст из виджета поддержки.
                </p>
            ) : (
                ledByOther && (
                    <p className="pt-3 text-sm text-muted-foreground">
                        Заявку ведёт {selected?.assignedAdmin?.name ?? 'другой администратор'} — отвечать может только
                        он.
                    </p>
                )
            )}
            <div className="mt-4 flex items-end gap-2 border-t pt-4">
                <ChatTextarea
                    value={text}
                    onChange={onChangeText}
                    placeholder={
                        isClosed
                            ? 'Обращение закрыто'
                            : ledByOther
                              ? 'Отвечать может только ведущий заявку'
                              : 'Ответ пользователю...'
                    }
                    onSend={onSend}
                    disabled={!canAct}
                />
                <button
                    type="button"
                    onClick={onSend}
                    aria-label="Отправить"
                    disabled={!canAct}
                    className="mb-6 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Send className="h-6 w-6" />
                </button>
            </div>
        </>
    );
}
