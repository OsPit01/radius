import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { enforceRateLimit } from '@/server/rate-limit';
import { resolveAddressByUri, searchAddresses } from '@/server/yandex-geocoder';
import { suggestAddresses } from '@/server/yandex-geosuggest';

// Бесплатные квоты Яндекса (по 1000 запросов в сутки на геокодер и на геосаджест) общие на всех — не даём одному
// пользователю их выжечь. Геосаджест вызывается на каждую паузу при вводе, поэтому лимит у него выше.
const GEOSUGGEST_RATE_LIMIT = 60;
const GEOCODE_RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

export const geoRouter = createTRPCRouter({
    // Подсказки адреса по всей Беларуси, пока человек печатает (Яндекс Геосаджест). Только для авторизованных.
    suggestAddress: protectedProcedure
        .input(
            z.object({
                query: z
                    .string()
                    .max(150)
                    .refine((value) => value.trim().length >= 3),
            }),
        )
        .query(async ({ ctx, input }) => {
            await enforceRateLimit(ctx.db, `geosuggest:${ctx.session.user.id}`, GEOSUGGEST_RATE_LIMIT, RATE_WINDOW_MS);
            return suggestAddresses(input.query.trimStart());
        }),

    // Все данные адреса по выбранной подсказке: область, район, город, улица, дом, координаты (Яндекс Геокодер).
    resolveAddress: protectedProcedure
        // uri приходит из подсказки и уходит в Яндекс только как параметр запроса; формат проверяем, чтобы не пропускать мусор.
        .input(z.object({ uri: z.string().startsWith('ymapsbm1://').max(2000) }))
        .query(async ({ ctx, input }) => {
            await enforceRateLimit(ctx.db, `geocode:${ctx.session.user.id}`, GEOCODE_RATE_LIMIT, RATE_WINDOW_MS);
            return resolveAddressByUri(input.uri);
        }),

    // Поиск координат по тексту — для адреса, введённого вручную (форма добавления объекта, ручной режим).
    searchAddress: protectedProcedure
        .input(z.object({ query: z.string().trim().min(3).max(150) }))
        .query(async ({ ctx, input }) => {
            await enforceRateLimit(ctx.db, `geocode:${ctx.session.user.id}`, GEOCODE_RATE_LIMIT, RATE_WINDOW_MS);
            return searchAddresses(input.query);
        }),
});
