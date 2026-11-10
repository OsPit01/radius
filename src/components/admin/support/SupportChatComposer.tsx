import { ChatTextarea } from '@/components/chat/ChatTextarea';
import { Send } from '@/components/icons';
import { SUPPORT_TEMPLATES } from '@/lib/constants/support-templates';

type SupportChatComposerProps = {
    text: string;
    onChangeText: (value: string) => void;
    onSend: () => void;
    /** Действовать может: не закрыта И не ведёт другой админ. */
    canAct: boolean;
    /** Заявка закрыта. */
    isClosed: boolean;
    /** Заявку ведёт другой админ. */
    ledByOther: boolean;
    /** Имя ведущего админа (для пометки «Заявку ведёт …»). */
    leadName: string | null;
};

/**
 * Нижняя часть окна заявки: шаблоны ответов + пометка о недоступности +
 * поле ввода с кнопкой отправки.
 */
export function SupportChatComposer({
    text,
    onChangeText,
    onSend,
    canAct,
    isClosed,
    ledByOther,
    leadName,
}: SupportChatComposerProps) {
    return (
        <>
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
                        Заявку ведёт {leadName ?? 'другой администратор'} — отвечать может только он.
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
