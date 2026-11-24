'use client';

import { useEffect } from 'react';

import { useSession } from 'next-auth/react';

import { api } from '@/trpc/react';

// ============================================================
// useOnlineHeartbeat — «я на сайте» для системы присутствия.
//
// Раз в минуту (пока вкладка видима) отправляет user.heartbeat,
// сервер обновляет lastSeenAt. По lastSeenAt админка и чаты
// показывают «онлайн».
//
// Три защиты от лишних запросов:
// 1) работает только для авторизованных;
// 2) когда вкладка скрыта (переключился в другую) — пауза,
//    при возврате — сразу одно обновление;
// 3) интервал 60 сек = 1 запрос в минуту (лимит сервера 60/мин).
//
// Подключается ОДИН раз на всё приложение (в _app), а не на каждой странице.
// ============================================================

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useOnlineHeartbeat() {
    const { status } = useSession();
    const heartbeat = api.user.heartbeat.useMutation();

    useEffect(() => {
        // Не авторизован — ничего не шлём.
        if (status !== 'authenticated') {
            return;
        }

        const send = () => {
            // Скрытая вкладка — не тратим запрос (пользователя нет на экране).
            if (document.visibilityState === 'hidden') {
                return;
            }
            heartbeat.mutate();
        };

        // Первый раз сразу при входе, дальше — по интервалу.
        send();
        const interval = setInterval(send, HEARTBEAT_INTERVAL_MS);

        // Вернулись во вкладку — сразу обновляем (не ждём следующего тика).
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                send();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
        // status меняется раз за сессию; heartbeat.mutate — стабильная ссылка.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);
}
