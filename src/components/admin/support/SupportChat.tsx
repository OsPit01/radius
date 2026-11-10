import { useEffect, useRef } from 'react';

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
}: SupportChatProps) {
    // Автопрокрутка вниз: при открытии заявки и при новых сообщениях.
    const messagesRef = useRef<HTMLDivElement>(null);

    // Заявку ведёт другой админ: смотреть можно, отвечать нельзя.
    const ledByOther = Boolean(selected?.assignedAdmin) && selected?.assignedAdmin?.id !== myId;

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
                    <button
                        type="button"
                        onClick={onTake}
                        className="h-11 cursor-pointer rounded-[30px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Участвовать
                    </button>
                )}

                {/* «Выйти» видит только тот, кто ведёт эту заявку. */}
                {selected?.assignedAdmin?.id === myId && (
                    <button
                        type="button"
                        onClick={onLeave}
                        className="h-11 cursor-pointer rounded-[30px] border border-border px-4 text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                        Выйти
                    </button>
                )}

                <button
                    type="button"
                    onClick={onOpenTransfer}
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
                        isMine={m.message.senderId === myId}
                        sender={m.sender}
                        createdAt={m.message.createdAt}
                    />
                ))}
            </div>

            {/* Подсказки-шаблоны: клик — текст летит в поле ввода. */}
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

            {/* Поле ввода + кнопка отправки. Если заявку ведёт другой админ —
                поле заблокировано и видна пометка. */}
            {ledByOther && (
                <p className="pt-3 text-sm text-muted-foreground">
                    Заявку ведёт {selected?.assignedAdmin?.name ?? 'другой администратор'} — отвечать может только он.
                </p>
            )}
            <div className="mt-4 flex items-end gap-2 border-t pt-4">
                <ChatTextarea
                    value={text}
                    onChange={onChangeText}
                    placeholder={ledByOther ? 'Отвечать может только ведущий заявку' : 'Ответ пользователю...'}
                    onSend={onSend}
                    disabled={ledByOther}
                />
                <button
                    type="button"
                    onClick={onSend}
                    aria-label="Отправить"
                    disabled={ledByOther}
                    className="mb-6 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Send className="h-6 w-6" />
                </button>
            </div>
        </>
    );
}
