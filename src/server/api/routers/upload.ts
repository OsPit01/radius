import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { optimizeImage } from '@/server/image-optimizer';
import { enforceRateLimit } from '@/server/rate-limit';
import { getSupabaseAdmin } from '@/server/supabase';

// Максимальный размер загружаемого изображения — 5 МБ.
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// Защита от флуда: сколько изображений один пользователь может загрузить за час.
const UPLOAD_RATE_LIMIT = 20;
const UPLOAD_RATE_WINDOW_MS = 60 * 60 * 1000;

export const uploadRouter = createTRPCRouter({
    image: protectedProcedure.input(z.object({ dataUrl: z.string() })).mutation(async ({ ctx, input }) => {
        await enforceRateLimit(ctx.db, `upload:${ctx.session.user.id}`, UPLOAD_RATE_LIMIT, UPLOAD_RATE_WINDOW_MS);

        // dataUrl выглядит так: "data:image/jpeg;base64,<данные>"
        const match = /^data:(image\/[\w+-]+);base64,(.+)$/.exec(input.dataUrl);
        if (!match) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Неверный формат изображения',
            });
        }

        const mimeType = match[1] ?? 'image/jpeg';
        const base64 = match[2] ?? '';

        // SVG запрещён: может содержать скрипты (XSS).
        if (mimeType === 'image/svg+xml') {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Формат SVG не поддерживается',
            });
        }

        const buffer = Buffer.from(base64, 'base64');

        // Лимит размера файла, чтобы не загружали слишком тяжёлые изображения.
        if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
            throw new TRPCError({
                code: 'PAYLOAD_TOO_LARGE',
                message: 'Файл слишком большой. Максимум 5 МБ',
            });
        }

        // ===== ОПТИМИЗАЦИЯ (КРИТИЧЕСКИ ВАЖНЫЙ БЛОК) =====
        // Любой входящий файл (jpeg/png/heic/etc) конвертируется в WebP
        // с ресайзом до 1920px. Это гарантирует:
        // 1. Всегда один формат (WebP) — проще кэшировать, быстрее грузить
        // 2. Максимальный размер 1920px — достаточно для всех экранов
        // 3. Качество 80 — визуально неотличимо от оригинала, вес в 3-5 раз меньше
        //
        // Если optimizeImage бросает ошибку (битый файл, неподдерживаемый формат) —
        // отклоняем загрузку с внятным сообщением.
        let optimized;
        try {
            optimized = await optimizeImage(buffer);
        } catch {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Не удалось обработать изображение. Убедитесь, что файл не повреждён и не является анимацией.',
            });
        }

        // Файл назначения: {uuid}.webp — расширение всегда .webp
        const fileName = `${crypto.randomUUID()}.webp`;

        const supabaseAdmin = getSupabaseAdmin();

        const { error } = await supabaseAdmin.storage.from('apartments').upload(fileName, optimized.buffer, {
            contentType: 'image/webp', // всегда webp
            cacheControl: '3600',
        });

        if (error) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Ошибка загрузки: ${error.message}`,
            });
        }

        const { data } = supabaseAdmin.storage.from('apartments').getPublicUrl(fileName);

        return { url: data.publicUrl };
    }),
});
