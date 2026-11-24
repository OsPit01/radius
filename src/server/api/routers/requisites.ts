import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { canManageRequisites } from '@/lib/constants/roles';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { requisites } from '@/server/db/schemas';

// Всегда работаем с ЕДИНСТВЕННОЙ строкой таблицы.
const REQUISITES_ID = 1;

// Схема обновления реквизитов. Поля обязательные: пустые реквизиты
// в футере и документах — битый сайт, поэтому .min(1) у каждой строки.
const updateSchema = z.object({
    legalName: z.string().trim().min(1).max(255),
    unp: z.string().trim().min(1).max(50),
    legalAddress: z.string().trim().min(1).max(500),
    supportEmail: z.string().trim().min(1).max(255),
    privacyEmail: z.string().trim().min(1).max(255),
    supportTelegram: z.string().trim().min(1).max(100),
    supportTelegramUrl: z.string().trim().min(1).max(255),
    footerPrivacyEmail: z.string().trim().min(1).max(255),
    footerSupportEmail: z.string().trim().min(1).max(255),
});

export const requisitesRouter = createTRPCRouter({
    // Текущие реквизиты (или null — строка ещё не создана, берём OPERATOR-дефолты).
    // Публичная: реквизиты и так показываются всем в футере и на /contacts.
    get: publicProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db.select().from(requisites).where(eq(requisites.id, REQUISITES_ID));
        return rows[0] ?? null;
    }),

    // Сохранить реквизиты. Суперадмин+ и legalAdmin (единый источник правды —
    // canManageRequisites: страница, плитка и процедура проверяют одно и то же).
    update: protectedProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
        if (!canManageRequisites(ctx.session.user.role)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Только супер админ, главный админ или юридический администратор',
            });
        }

        // Upsert по фиксированному id=1: создаём строку, если её нет,
        // иначе перезаписываем.
        const [saved] = await ctx.db
            .insert(requisites)
            .values({ id: REQUISITES_ID, ...input, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: requisites.id,
                set: {
                    ...input,
                    updatedAt: new Date(),
                },
            })
            .returning();
        return saved;
    }),
});
