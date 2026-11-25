// ============================================================
// КАНАЛЫ УВЕДОМЛЕНИЙ — ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ
//
// Список мессенджеров, куда можно слать уведомления (заявки,
// статусы, напоминания). Сейчас только Telegram, но добавление
// нового канала = ОДНА строка здесь + отправитель в реестре
// (см. src/server/notification-channels.ts) + кнопка в UI.
// Остальная логика (notifyUser и т.п.) не меняется.
// ============================================================

export const NOTIFICATION_CHANNEL_VALUES = [
    'telegram', // Telegram-бот: chatId
    // 'whatsapp', // в перспективе: номер телефона
    // 'viber', // в перспективе: номер телефона
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNEL_VALUES)[number];

/** Русские подписи каналов — для UI (подключение, настройки). */
export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
    telegram: 'Telegram',
};
