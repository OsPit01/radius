import { useEffect } from 'react';

import { getOrCreateVisitorId } from '@/lib/visitor';
import { api } from '@/trpc/react';

// Считает уникальный просмотр конкретной квартиры. Один браузер может
// просмотреть квартиру только один раз (составной ключ visitorId+apartmentId).
export function ApartmentViewTracker({ apartmentId }: { apartmentId: number }) {
    const track = api.analytics.trackApartmentView.useMutation();

    useEffect(() => {
        track.mutate({ visitorId: getOrCreateVisitorId(), apartmentId });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apartmentId]);

    return null;
}
