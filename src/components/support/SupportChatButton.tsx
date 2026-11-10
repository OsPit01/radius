import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { Chat } from '@/components/icons';
import { api } from '@/trpc/react';

import { SupportChatWindow } from './SupportChatWindow';

/**
 * Плавающая кнопка «Поддержка» + бейдж непрочитанных ответов.
 * Вся логика беседы — в SupportChatWindow; здесь только решение
 * «показать/скрыть окно» и счётчик для бейджа.
 */
export function SupportChatButton() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);

    // Бейдж непрочитанных ответов поддержки. Опрос раз в 30 сек —
    // тот же ритм, что у бейджа сообщений в шапке. Когда окно помечает
    // ответы прочитанными, invalidate из SupportChatWindow обновит счётчик
    // сам: кэш react-query у всех компонентов один.
    const { data: unread } = api.support.unreadCount.useQuery(undefined, {
        enabled: !!session?.user,
        refetchInterval: 30000,
    });

    return (
        <>
            {open && <SupportChatWindow onClose={() => setOpen(false)} />}
            {/* Кнопка — ТОЛЬКО для залогиненных (процедуры поддержки требуют сессию). */}
            {session?.user && (
                <div className="fixed right-5 bottom-5 z-50">
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                        aria-label="Поддержка"
                    >
                        <Chat className="h-7 w-7" />
                    </button>
                    {/* Бейдж: сколько ответов поддержки я ещё не прочитал.
                        Появляется только при непрочитанных (> 0), как бейдж
                        сообщений в шапке; ring-2 — отрыв от фона. */}
                    {(unread ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs leading-none font-semibold text-destructive-foreground ring-2 ring-background">
                            {unread}
                        </span>
                    )}
                </div>
            )}
        </>
    );
}
