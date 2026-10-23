import { ArrowLeft, Close } from '@/components/icons';
import { type ChatPerson, displayName } from '@/lib/chat';
type ChatHeaderProps = {
    /** Название квартиры. */
    formattedAddress: string;
    /** Собеседник (гость или владелец — кого показываем). */
    companion: ChatPerson;
    /** Кнопка «назад» к списку бесед. */
    onBack: () => void;
    /** Удалить беседу (кнопка видна только админу). */
    onDeleteConversation?: () => void;
};

/**
 * Шапка окна чата: кнопка «назад», название квартиры,
 * имя собеседника и даты бронирования.
 */
export function ChatHeader({ formattedAddress, companion, onBack, onDeleteConversation }: ChatHeaderProps) {
    return (
        <div className="flex items-center gap-3 border-b border-border py-3">
            <button
                type="button"
                onClick={onBack}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl text-[20px] font-semibold text-foreground transition-colors hover:bg-muted"
                aria-label="Назад к списку бесед"
            >
                <ArrowLeft className="h-6 w-6" />
            </button>

            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{formattedAddress}</p>
                <p className="truncate text-sm text-muted-foreground">{displayName(companion)}</p>
            </div>

            {onDeleteConversation && (
                <button
                    type="button"
                    onClick={onDeleteConversation}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Удалить беседу"
                >
                    <Close className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
