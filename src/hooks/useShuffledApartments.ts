// src/hooks/useShuffledApartments.ts

import { useEffect, useState } from 'react';

import type { ApartmentCardData } from '@/lib/apartment-format';

const RESHUFFLE_INTERVAL_MS = 900_000; // 15 минут

function shuffle<T>(list: readonly T[]): T[] {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j] as T, result[i] as T];
    }
    return result;
}

/**
 * Порядок объявлений в выдаче каждый раз случайный, чтобы все владельцы получали равное внимание:
 * перемешиваем после загрузки страницы, раз в 15 минут и когда вкладка снова становится активной.
 *
 * С сервера приходит стабильный порядок (его видят поисковые роботы),
 * перемешивание происходит только в браузере — после гидрации.
 */
export function useShuffledApartments(initialApartments: ApartmentCardData[]): ApartmentCardData[] {
    const [apartments, setApartments] = useState(initialApartments);

    useEffect(() => {
        setApartments(shuffle(initialApartments));
    }, [initialApartments]);

    useEffect(() => {
        if (apartments.length === 0) {
            return;
        }
        const reshuffle = () => setApartments((prev) => shuffle(prev));
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                reshuffle();
            }
        };

        const interval = setInterval(reshuffle, RESHUFFLE_INTERVAL_MS);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [apartments.length]);

    return apartments;
}
