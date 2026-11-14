// ЕДИНАЯ точка отправки уведомлений: колокольчик на сайте (запись в БД)
// + дублирование в Telegram тем, кто его подключил. Все роутеры зовут
// только эту функцию — отправить уведомление «забыв» про телеграм, невозможно.
import { eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { sendTelegramMessage } from '@/lib/telegram';
import type * as schema from '@/server/db/schemas';
import { notification, users } from '@/server/db/schemas';

type Database = PostgresJsDatabase<typeof schema>;

// Поля, которые нужны для записи в radius_notification (схема notification)
type NotifyData = {
    userId: string;
    type: string;
    title: string;
    text: string;
    apartmentId?: number;
    link?: string;
    // Красивый текст для телеграма (с HTML-разметкой). Если не передан —
    // собираем стандартный: «заголовок + текст» (см. отправку ниже)
    telegramText?: string;
};

// В телеграм текст уходит как HTML (parse_mode='HTML' стоит в sendTelegramMessage),
// а название квартиры может содержать < или & — например, «Студия <3».
// Без экранирования Telegram отверг бы ВСЁ сообщение целиком.
// Экспортируем: роутеры собирают красивые telegramText с данными из БД —
// экранирование должно жить в одном месте, а не копироваться.
export function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

    // 2. Куда слать в Telegram: смотрим chatId получателя одним запросом
    const [recipient] = await db
        .select({ telegramChatId: users.telegramChatId })
        .from(users)
        .where(eq(users.id, data.userId));

    const chatId = recipient?.telegramChatId;
    if (!chatId) {
        return; // телеграм не подключён — достаточно колокольчика
    }

    // 3. Дублируем в Telegram. Ошибка отправки НЕ должна ронять основную
    //    операцию (объект уже одобрен, бронь уже создана!) — поэтому try/catch:
    //    уведомление вторично, сбой логируем и живём дальше.
    try {
        const text = data.telegramText ?? [`<b>${escapeHtml(data.title)}</b>`, '', escapeHtml(data.text)].join('\n');
        await sendTelegramMessage(chatId, text);
    } catch (error) {
        console.error(
            `Не удалось отправить телеграм-уведомление пользователю ${data.userId}`,
            error instanceof Error ? error.message : error,
        );
    }
}

/**
 * Массовая отправка одного события нескольким получателям (например, «новое
 * сообщение в поддержку» — всем админам). Один batch-INSERT на всех (а не N
 * запросов в цикле), один SELECT chatId'ов через inArray, отправки в телеграм —
 * параллельно через Promise.all: суммарное время = самой медленной отправке,
 * а не сумме всех.
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

    // 2. Все chatId одним запросом: WHERE id IN (…)
    const recipients = await db
        .select({ id: users.id, telegramChatId: users.telegramChatId })
        .from(users)
        .where(
            inArray(
                users.id,
                items.map((item) => item.userId),
            ),
        );

    const chatById = new Map(recipients.map((r) => [r.id, r.telegramChatId]));

    // 3. Параллельные отправки. Каждая в своём try/catch — сбой одной
    //    не должен отменять остальные (побочный канал страдает молча).
    await Promise.all(
        items.map(async (item) => {
            const chatId = chatById.get(item.userId);
            if (!chatId) {
                return; // у этого получателя телеграм не подключён
            }
            try {
                const text =
                    item.telegramText ?? [`<b>${escapeHtml(item.title)}</b>`, '', escapeHtml(item.text)].join('\n');
                await sendTelegramMessage(chatId, text);
            } catch (error) {
                console.error(
                    `Не удалось отправить телеграм-уведомление пользователю ${item.userId}`,
                    error instanceof Error ? error.message : error,
                );
            }
        }),
    );
}
