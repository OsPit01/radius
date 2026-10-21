import { Avatar } from '@/components/ui/Avatar';
import { avatarInitial, type ChatPerson, displayName, formatChatDate } from '@/lib/chat';

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
export function MessageBubble({ text, isMine, sender, createdAt }: MessageBubbleProps) {
    return (
        <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
            {/* Аватар отправителя: фото или буква, если фото нет / не загрузилось. */}
            <Avatar
                src={sender?.image}
                name={displayName(sender)}
                fallbackText={avatarInitial(sender)}
                size={32}
            />

            {/* min-w-0 разрешает flex-элементу сжиматься, а не растягивать окно. */}
            <div className="flex max-w-[70%] min-w-0 flex-col">
                {/* Имя отправителя (видно только у чужих, чтобы отличать в групповой переписке) */}
                {!isMine && <span className="mb-0.5 px-1 text-xs text-muted-foreground">{displayName(sender)}</span>}

                {/* break-words переносит длинные слова, чтобы текст не вылезал за пузырь. */}
                <div
                    className={`rounded-2xl px-4 py-2 text-[15px] break-words whitespace-pre-line ${
                        isMine
                            ? 'rounded-br-sm bg-primary text-primary-foreground'
                            : 'rounded-bl-sm bg-muted text-foreground'
                    }`}
                >
                    {text}
                </div>

                <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">{formatChatDate(createdAt)}</span>
            </div>
        </div>
    );
}
