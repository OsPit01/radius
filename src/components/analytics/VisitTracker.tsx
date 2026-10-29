'use client';

// ============================================================
// VisitTracker — подсчёт уникальных переходов на сайт
// ============================================================
//
// Отправляет id браузера (visitorId) на сервер только после того,
// как пользователь дал согласие на категорию «Аналитика».
// Раньше идентификатор создавался и отправлялся сразу при загрузке
// страницы — это была аналитика без согласия.
//
// Идентификатор хранится в localStorage (см. src/lib/visitor.ts):
// один браузер = один переход, обновления страницы не считаются.
// ============================================================

import { useEffect } from 'react';

import { useCookieConsent } from '@/components/consent/CookieConsentContext';
import { getOrCreateVisitorId } from '@/lib/visitor';
import { api } from '@/trpc/react';

export function VisitTracker() {
    const track = api.analytics.trackSiteVisit.useMutation();
    const { consent } = useCookieConsent();

    useEffect(() => {
        // Важно: getOrCreateVisitorId ПИШЕТ id в localStorage — поэтому
        // вызываем его только после согласия, иначе мы создавали бы
        // трекер даже у тех, кто отказался.
        if (consent?.categories.analytics) {
            track.mutate({ visitorId: getOrCreateVisitorId() });
        }
        // Отправляем один раз при появлении согласия: повторные рендеры
        // не дублируют запрос (на сервере всё равно onConflictDoNothing).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [consent?.categories.analytics]);

    return null;
}
