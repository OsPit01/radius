import { z } from 'zod';

import { env } from '@/env';

const telegramApiBase = 'https://api.telegram.org/bot';

const telegramResponseSchema = z.object({
    ok: z.boolean(),
    description: z.string().optional(),
});

/**
 * Отправляет сообщение в Telegram от имени бота.
 * @param chatId - идентификатор чата (например, личный диалог с ботом)
 * @param text - текст сообщения (HTML разметка разрешена)
 */
export async function sendTelegramMessage(
    chatId: string,
    text: string,
): Promise<{ ok: boolean; description?: string }> {
    const url = new URL(`${telegramApiBase}${env.TELEGRAM_BOT_TOKEN}/sendMessage`);

    url.searchParams.set('chat_id', chatId);
    url.searchParams.set('text', text);
    url.searchParams.set('parse_mode', 'HTML');

    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
        return { ok: false, description: `HTTP ${response.status}` };
    }

    const data = telegramResponseSchema.safeParse(await response.json());

    return {
        ok: data.data?.ok ?? false,
        description: data.data?.description,
    };
}
