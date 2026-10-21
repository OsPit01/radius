import { eq } from 'drizzle-orm';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { env } from '@/env';
import { sendTelegramMessage } from '@/lib/telegram';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';

const telegramUpdateSchema = z.object({
    message: z
        .object({
            chat: z.object({
                id: z.number(),
            }),
            text: z.string().optional(),
        })
        .optional(),
});

/**
 * Webhook для Telegram: Telegram сам присылает сюда каждое сообщение боту,
 * когда пользователь отправляет ему код привязки.
 * Регистрируется вызовом метода setWebhook (см. scripts/register-telegram-webhook.mjs).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false });
    }

    // Проверяем секретную подпись, если секрет задан в окружении
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return res.status(401).json({ ok: false });
    }

    // Тело (JSON) уже разобрано Next
    const parsed = telegramUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(200).json({ ok: false });
    }

    const message = parsed.data.message;
    const chatId = message?.chat.id;
    const text = message?.text?.trim();

    // Пришло не текстовое сообщение (фото, стикер и т.п.) — игнорируем
    if (chatId === undefined || !text) {
        return res.status(200).json({ ok: true });
    }

    // Поддержка двух способов привязки:
    // 1) пользователь присылает просто код (старый способ);
    // 2) пользователь жмёт deep-link «/start КОД» (новый, без ручного ввода).
    let code = text;
    if (text.startsWith('/start')) {
        code = text.replace('/start', '').trim();
    }

    // Если кода нет (например просто «/start» без аргумента) — нечего привязывать.
    if (!code) {
        return res.status(200).json({ ok: true });
    }

    // Ищем пользователя, которому был выдан такой код привязки
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.telegramLinkCode, code)).limit(1);

    if (!user) {
        // Код не совпал — просто отвечаем Telegram, что приняли сообщение
        return res.status(200).json({ ok: true });
    }

    // Код верный — привязываем чат и очищаем код
    await db
        .update(users)
        .set({ telegramChatId: String(chatId), telegramLinkCode: null })
        .where(eq(users.id, user.id));

    await sendTelegramMessage(
        String(chatId),
        'Поздравляем! Вы подключили уведомления. Теперь на этот чат будут приходить заявки на бронирование.',
    );

    return res.status(200).json({ ok: true });
}
