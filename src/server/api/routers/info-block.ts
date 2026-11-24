import { TRPCError } from '@trpc/server';
import { asc, eq, max } from 'drizzle-orm';
import { z } from 'zod';

import { canManageInfoBlocks, isAdminRole, isLessorRole } from '@/lib/constants/roles';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { infoBlock } from '@/server/db/schemas';

// Схема одного пункта: текст обязателен, ссылка — необязательна.
// transform(v => v ?? null): если ссылку не передали (undefined) — превращаем в null.
// Так тип на выходе совпадает с InfoItemData (href: string | null), и jsonb принимает без кастов.
const infoItemSchema = z.object({
    text: z.string().trim().min(1).max(1000),
    href: z
        .string()
        .nullish()
        .transform((v) => v ?? null),
});

// Схема одного блока — общая для создания и обновления (один источник правды).
// sortOrder НЕ принимаем от клиента: порядок задаётся только через drag/reorder,
// а новый блок сервер сам ставит в конец списка.
const infoBlockSchema = z.object({
    id: z.string().trim().min(1).max(100),
    icon: z.string().trim().min(1).max(50),
    title: z.string().trim().min(1).max(255),
    items: z.array(infoItemSchema).min(1),
});

export const infoBlockRouter = createTRPCRouter({
    // Все блоки раздела «Информация» — по порядку. Только арендодатель и выше:
    // вкладка живёт в «Управлении бронированиями», куда пускает requireRole('lessor').
    // Обычному пользователю (role "user") этот контент не нужен — не отдаём лишнего.
    list: protectedProcedure.query(async ({ ctx }) => {
        if (!isLessorRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только для арендодателя и выше',
            });
        }
        return ctx.db.select().from(infoBlock).orderBy(asc(infoBlock.sortOrder));
    }),

    // Создать или обновить блок. Модератор+ и legalAdmin.
    // Порядок (sortOrder) пользователь НЕ задаёт: новый блок встаёт в конец
    // (максимум + 1), а при обновлении существующего порядок не трогается —
    // его меняет только reorder (drag-and-drop).
    upsert: protectedProcedure.input(infoBlockSchema).mutation(async ({ ctx, input }) => {
        if (!canManageInfoBlocks(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только модератор или администратор',
            });
        }

        // Существует ли блок с таким id? Решает: создаём или обновляем.
        const [existing] = await ctx.db.select().from(infoBlock).where(eq(infoBlock.id, input.id));

        if (existing) {
            // Обновляем только контент — порядок остаётся прежним.
            return ctx.db
                .update(infoBlock)
                .set({
                    icon: input.icon,
                    title: input.title,
                    items: input.items,
                })
                .where(eq(infoBlock.id, input.id))
                .returning();
        }

        // Новый блок: ставим в конец списка (максимальный sortOrder + 1).
        const [row] = await ctx.db.select({ m: max(infoBlock.sortOrder) }).from(infoBlock);
        const nextOrder = (row?.m ?? -1) + 1;
        return ctx.db
            .insert(infoBlock)
            .values({
                id: input.id,
                icon: input.icon,
                title: input.title,
                items: input.items,
                sortOrder: nextOrder,
            })
            .returning();
    }),

    // Переупорядочить блоки. Принимает массив id в НУЖНОМ порядке и
    // переписывает sortOrder подряд (0, 1, 2...). Один endpoint на всё:
    // и стрелки ↑↓, и drag-and-drop отправляют сюда новый порядок id.
    reorder: protectedProcedure.input(z.object({ ids: z.array(z.string()) })).mutation(async ({ ctx, input }) => {
        if (!canManageInfoBlocks(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только модератор или администратор',
            });
        }

        // Транзакция: либо весь порядок переписался, либо ничего.
        // Иначе при ошибке на середине получится «рваный» порядок.
        await ctx.db.transaction(async (tx) => {
            for (let i = 0; i < input.ids.length; i += 1) {
                // noUncheckedIndexedAccess: элемент массива «может отсутствовать».
                const id = input.ids[i];
                if (id === undefined) {
                    continue;
                }
                await tx.update(infoBlock).set({ sortOrder: i }).where(eq(infoBlock.id, id));
            }
        });
        return { ok: true };
    }),

    // Удалить блок. Только админ и выше.
    delete: protectedProcedure.input(z.object({ id: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => {
        if (!isAdminRole(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только администратор',
            });
        }

        const [deleted] = await ctx.db
            .delete(infoBlock)
            .where(eq(infoBlock.id, input.id))
            .returning({ id: infoBlock.id });

        if (!deleted) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Блок не найден' });
        }
        return { ok: true };
    }),
});
