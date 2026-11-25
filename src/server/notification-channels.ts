// ============================================================
// РЕЕСТР ОТПРАВИТЕЛЕЙ КАНАЛОВ УВЕДОМЛЕНИЙ
//
// Каждый канал (telegram, whatsapp...) умеет доставить текст по
// «адресу» (target). notifyUser не знает про конкретные мессенджеры —
// он просто берёт канал из БД и зовёт отправитель отсюда.
//
// Добавление нового мессенджера = ОДНА функция здесь + имя в
// NOTIFICATION_CHANNEL_VALUES (константы). Логика уведомлений
// и все роутеры не меняются.
// ============================================================

import { type NotificationChannel } from '@/lib/constants/notification-channels';
import { sendTelegramMessage } from '@/lib/telegram';

/** Что возвращает отправитель канала: ok + необязательное описание ошибки. */
type SendResult = { ok: boolean; description?: string };

export const CHANNEL_SENDERS: Record<NotificationChannel, (target: string, text: string) => Promise<SendResult>> = {
    telegram: async (chatId, text) => {
        const result = await sendTelegramMessage(chatId, text);
        return { ok: result.ok, description: result.description };
    },
};
