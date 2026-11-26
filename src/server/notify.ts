// ЕДИНАЯ точка отправки уведомлений: колокольчик на сайте (запись в БД)
// + дублирование по всем подключённым каналам (Telegram, в будущем — другие).
// Все роутеры зовут только эту функцию — отправить уведомление «забыв»
// про каналы невозможно.
import { eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { type NotificationType } from '@/lib/constants/notification';
import { type NotificationChannel } from '@/lib/constants/notification-channels';
import type * as schema from '@/server/db/schemas';
import { notification, userChannel } from '@/server/db/schemas';
import { CHANNEL_SENDERS } from '@/server/notification-channels';

type Database = PostgresJsDatabase<typeof schema>;

// Поля, которые нужны для записи в radius_notification (схема notification).
// type — НЕ произвольная строка, а NotificationType: колонка в БД теперь enum,
// и опечатка в типе уведомления ловится компилятором, а не «тихо» уезжает в БД.
type NotifyData = {
    userId: string;
    type: NotificationType;
    title: string;
    text: string;
    apartmentId?: number;
    link?: string;
    // Красивый текст для каналов (с HTML-разметкой). Если не передан —
    // собираем стандартный: «заголовок + текст» (см. отправку ниже)
    telegramText?: string;
};

// В каналы текст уходит как HTML (parse_mode='HTML' в Telegram), а название
// квартиры может содержать < или & — например, «Студия <3». Без экранирования
// Telegram отверг бы ВСЁ сообщение целиком. Экспортируем: роутеры собирают
// красивые telegramText с данными из БД — экранирование живёт в одном месте.
export function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Подключённые каналы пользователя (channel → target). */
async function getChannels(db: Database, userId: string): Promise<{ channel: NotificationChannel; target: string }[]> {
    const rows = await db
        .select({ channel: userChannel.channel, target: userChannel.target })
        .from(userChannel)
        .where(eq(userChannel.userId, userId));
    return rows;
}

/** Отправить текст по одному каналу. Ошибка НЕ роняет основную операцию. */
async function sendToChannel(
    channel: NotificationChannel,
    target: string,
    text: string,
    userId: string,
): Promise<void> {
    const sender = CHANNEL_SENDERS[channel];
    if (!sender) {
        return; // канал не зарегистрирован в реестре (не должно случаться, но безопасно)
    }
    try {
        const result = await sender(target, text);
        // Отправитель возвращает ok:false, НЕ бросая исключение: например, Telegram
        // отвечает 403, если пользователь не начал диалог с ботом. Раньше такой отказ
        // был невидимым — в базе уведомление есть, а в мессенджер не пришло.
        if (!result.ok) {
            console.error(
                `Канал ${channel} отклонил уведомление пользователю ${userId}: ${result.description ?? 'причина не указана'}`,
            );
        }
    } catch (error) {
        // Уведомление вторично: сбой одного канала не должен отменять
        // основную операцию (бронь создана, объект одобрен). Логируем и живём.
        console.error(
            `Не удалось отправить уведомление пользователю ${userId} в канал ${channel}`,
            error instanceof Error ? error.message : error,
        );
    }
}

export async function notifyUser(db: Database, data: NotifyData): Promise<void> {
    // 1. Колокольчик: запись в БД. Необязательные поля (apartmentId, link)
    //    в колонках nullable — undefined превращаем в честный null.
    await db.insert(notification).values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        text: data.text,
        apartmentId: data.apartmentId ?? null,
        link: data.link ?? null,
    });

    // 2. Подключённые каналы получателя — одним запросом.
    const channels = await getChannels(db, data.userId);

    const text = data.telegramText ?? [`<b>${escapeHtml(data.title)}</b>`, '', escapeHtml(data.text)].join('\n');

    // 3. Дублируем в каждый канал. Каждый — в своём try/catch.
    await Promise.all(channels.map((c) => sendToChannel(c.channel, c.target, text, data.userId)));
}

/**
 * Массовая отправка одного события нескольким получателям (например, «новое
 * сообщение в поддержку» — всем админам). Один batch-INSERT на всех (а не N
 * запросов в цикле), один SELECT каналов через inArray, отправки — параллельно.
 */
export async function notifyMany(db: Database, items: NotifyData[]): Promise<void> {
    if (items.length === 0) {
        return; // пустой список — ничего не делаем (иначе INSERT упал бы)
    }

    // 1. Колокольчики: ОДИН INSERT с массивом значений
    await db.insert(notification).values(
        items.map((item) => ({
            userId: item.userId,
            type: item.type,
            title: item.title,
            text: item.text,
            apartmentId: item.apartmentId ?? null,
            link: item.link ?? null,
        })),
    );

    // 2. Все каналы всех получателей одним запросом: WHERE userId IN (…)
    const userIds = items.map((item) => item.userId);
    const channelRows = await db
        .select({ userId: userChannel.userId, channel: userChannel.channel, target: userChannel.target })
        .from(userChannel)
        .where(inArray(userChannel.userId, userIds));

    // Каналы, сгруппированные по получателю.
    const channelsByUser = new Map<string, { channel: NotificationChannel; target: string }[]>();
    for (const row of channelRows) {
        const list = channelsByUser.get(row.userId) ?? [];
        list.push({ channel: row.channel, target: row.target });
        channelsByUser.set(row.userId, list);
    }

    // 3. Параллельные отправки. Каждый канал — в своём try/catch.
    await Promise.all(
        items.flatMap((item) => {
            const channels = channelsByUser.get(item.userId) ?? [];
            const text =
                item.telegramText ?? [`<b>${escapeHtml(item.title)}</b>`, '', escapeHtml(item.text)].join('\n');
            return channels.map((c) => sendToChannel(c.channel, c.target, text, item.userId));
        }),
    );
}
