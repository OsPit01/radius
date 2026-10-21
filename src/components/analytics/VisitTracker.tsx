import { useEffect } from 'react';

import { getOrCreateVisitorId } from '@/lib/visitor';
import { api } from '@/trpc/react';

// Считает уникальный переход на сайт. Монтируется один раз на каждой
// странице (в корневом layout) и отправляет id браузера на сервер.
// Повторные заходы не создают новых записей (см. onConflictDoNothing).
export function VisitTracker() {
    const track = api.analytics.trackSiteVisit.useMutation();

    useEffect(() => {
        track.mutate({ visitorId: getOrCreateVisitorId() });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
