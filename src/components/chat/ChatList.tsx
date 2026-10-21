import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { displayName } from '@/lib/chat';
import type { RouterOutputs } from '@/trpc/react';

// Тип элемента списка — это ровно то, что возвращает процедура chat.list.
type ChatListItem = RouterOutputs['chat']['list'][number];

type ChatListProps = {
    chats: ChatListItem[];
    userId: string;
    /** id выбранной беседы — чтобы подсветить её. */
    selectedId?: number | null;
    onSelect: (conversationId: number) => void;
};

/**
 * Список бесед. Каждая карточка показывает:
 *  - фото квартиры (а не аватар собеседника — так понятнее, о каком объекте речь);
 *  - название квартиры;
 *  - имя собеседника.
 */
export function ChatList({ chats, userId, selectedId, onSelect }: ChatListProps) {
    return (
        <ul className="flex flex-col">
            {chats.map((c) => {
                // Кто собеседник: если я гость — показываем владельца, иначе — гостя.
                const other = c.conversation.guestId === userId ? c.owner : c.guest;
                const isActive = c.conversation.id === selectedId;

                return (
                    <li key={c.conversation.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(c.conversation.id)}
                            className={`mt-1 flex w-full items-center gap-3 rounded-[15px] border-b border-gray-300 px-2 py-3 text-left transition-colors hover:bg-[#fafafa] ${
                                isActive ? 'border border-gray-900 duration-700' : ''
                            }`}
                        >
                            {/* Фото квартиры (или заглушка, если фото нет / не загрузилось) */}
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f0f0f0]">
                                {c.apartment.image ? (
                                    <ImageWithFallback
                                        src={c.apartment.image}
                                        alt={c.apartment.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-lg">🏠</div>
                                )}
                            </div>

                            {/* Название квартиры + имя собеседника */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-[#222]">{c.apartment.title}</p>
                                <p className="truncate text-sm text-[#888]">{displayName(other)}</p>
                            </div>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
