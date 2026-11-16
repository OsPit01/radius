import { useEffect } from 'react';

import { getOrCreateVisitorId } from '@/lib/visitor';
import { api } from '@/trpc/react';

import { useCookieConsent } from '../consent/CookieConsentContext';

// Считает уникальный просмотр конкретной квартиры. Один браузер может
// просмотреть квартиру только один раз (составной ключ visitorId+apartmentId).
export function ApartmentViewTracker({ apartmentId }: { apartmentId: number }) {
    const track = api.analytics.trackApartmentView.useMutation();
    const { consent } = useCookieConsent();
    useEffect(() => {
        // Аналитика — только с согласия (та же логика, что в VisitTracker):
        // getOrCreateVisitorId ПИШЕТ id в localStorage, поэтому зовём его
        // только после согласия — отказавшимся не оставляем даже следа.
        if (consent?.categories.analytics) {
            track.mutate({ visitorId: getOrCreateVisitorId(), apartmentId });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apartmentId, consent?.categories.analytics]);

    return null;
}
