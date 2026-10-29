import { useEffect, useRef, useState } from 'react';

import { type ChatPerson, MAX_MESSAGE_LENGTH } from '@/lib/chat';
import type { RouterOutputs } from '@/trpc/react';

import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';

type ChatWindowProps = {
    /** Название квартиры (для шапки). */
    fullAddress: string;
    /** Собеседник (для шапки и аватара чужих сообщений). */
    companion: ChatPerson;
    /** Все сообщения диалога. */
    messages: RouterOutputs['chat']['messages'];
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
    /** true — текущий пользователь администратор (видит кнопки удаления). */
    isAdmin: boolean;
    /** true — беседа активна, можно писать. false — заблокирована админом. */
    conversationActive: boolean;
    /** Удалить одно сообщение по id (админ). */
    onDeleteMessage: (messageId: number) => void;
    /** Удалить беседу целиком (админ). */
    onDeleteConversation: () => void;
};

/**
 * Окно переписки: шапка с деталями брони, лента сообщений (пузыри)
 * и поле ввода снизу. Поле ввода и текст хранятся ЛОКАЛЬНО здесь,
 * чтобы родитель (страница) не знал о внутреннем состоянии ввода.
 */
export function ChatWindow({
    fullAddress,
    companion,
    messages,
    myUserId,
    myPerson,
    onBack,
    onSend,
    isSending,
    isAdmin,
    conversationActive,
    onDeleteMessage,
    onDeleteConversation,
}: ChatWindowProps) {
    // Текст в поле ввода — локальное состояние окна чата.
    const [text, setText] = useState('');
    // Ссылка на нижнюю точку ленты — для автопрокрутки вниз.
    const listRef = useRef<HTMLDivElement>(null);

    // При появлении новых сообщений прокручиваем ленту вниз.
    useEffect(() => {
        const el = listRef.current;
        if (!el) {
            return;
        }
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [messages?.length]);

    // Отправка: чистим текст сразу, а сам запрос делает родитель.
    const handleSend = () => {
        const value = text.trim();
        if (!value) {
            return;
        }
        onSend(value);
        setText('');
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* Шапка с деталями бронирования */}
            <ChatHeader
                formattedAddress={fullAddress}
                companion={companion}
                onBack={onBack}
                onDeleteConversation={isAdmin ? onDeleteConversation : undefined}
            />

            {/* Лента сообщений скроллится только она  */}
            <div
                ref={listRef}
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-8"
            >
                {messages?.length === 0 && <p className="py-8 text-center text-muted-foreground">Нет сообщений.</p>}
                {messages?.map((m) => {
                    const isMine = m.senderId === myUserId;
                    return (
                        <MessageBubble
                            key={m.id}
                            text={m.text}
                            isMine={isMine}
                            sender={isMine ? myPerson : companion}
                            createdAt={m.createdAt}
                            onDelete={isAdmin ? () => onDeleteMessage(m.id) : undefined}
                        />
                    );
                })}
                {/* Невидимая точка внизу — к ней скроллим при новом сообщении. */}
            </div>

            {/* Поле ввода + кнопка отправки */}
            {/* Поле ввода + кнопка отправки */}
            {/* items-end — чтобы кнопка НЕ растягивалась по высоте textarea */}
            <div className="flex shrink-0 items-end gap-2 border-t border-border pt-3">
                <textarea
                    rows={1}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        const el = e.target;

                        // авто-рост с ограничением по высоте (72px ≈ 3 строки).
                        // Меняй 72, если хочешь другую максимальную высоту поля.
                        el.style.height = 'auto';
                        el.style.height = `${Math.min(el.scrollHeight, 72)}px`;

                        // если текста больше, чем влезает — держим последнюю строку видимой,
                        // т.к. overflow-hidden и скроллбар скрыт
                        if (el.scrollHeight > 72) {
                            el.scrollTop = el.scrollHeight;
                        }
                    }}
                    onKeyDown={(e) => {
                        // Enter — отправить, Shift+Enter — новая строка
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={conversationActive ? 'Сообщение...' : 'Беседа заблокирована'}
                    disabled={!conversationActive}
                    // maxLength — жёсткий лимит символов: единая константа проекта
                    // (server chat.send проверяет то же число через Zod).
                    maxLength={MAX_MESSAGE_LENGTH}
                    className="min-w-0 flex-1 resize-none overflow-hidden rounded-2xl border border-border px-4 py-2.5 pr-5 text-[15px] text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!text.trim() || isSending || !conversationActive}
                    // self-end — страховка, чтобы кнопка всегда была снизу и не тянулась
                    className="shrink-0 cursor-pointer self-end rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
                >
                    Отправить
                </button>
            </div>
        </div>
    );
}
